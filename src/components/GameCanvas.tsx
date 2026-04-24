'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GameLoop } from '@/lib/game/GameLoop'
import { CAMERA_Y_OFFSET, CAMERA_Z_OFFSET } from '@/lib/game/constants'

interface GameCanvasProps {
  onScoreChange: (score: number, combo: number) => void
  onGameOver: (score: number) => void
  gameKey: number
}

export default function GameCanvas({ onScoreChange, onGameOver, gameKey }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastPointerX = useRef(0)

  const handlePointerDown = useCallback((x: number) => {
    isDragging.current = true
    lastPointerX.current = x
  }, [])

  const handlePointerMove = useCallback((x: number, gameLoopRef: React.MutableRefObject<GameLoop | null>) => {
    if (!isDragging.current || !gameLoopRef.current) return
    const deltaX = x - lastPointerX.current
    gameLoopRef.current.rotateTower(deltaX * 0.012)
    lastPointerX.current = x
  }, [])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    const renderer = new THREE.WebGLRenderer({
      antialias: pixelRatio <= 1,
      alpha: true,
    })
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, CAMERA_Y_OFFSET, CAMERA_Z_OFFSET)
    camera.lookAt(0, 0, 0)

    const gameLoop = new GameLoop(scene, camera, { onScoreChange, onGameOver })
    gameLoop.start()

    let rafId: number
    const renderLoop = () => {
      rafId = requestAnimationFrame(renderLoop)
      renderer.render(scene, camera)
    }
    renderLoop()

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Input handlers — need gameLoop reference
    const gameLoopRef = { current: gameLoop }

    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX)
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, gameLoopRef)
    const onMouseUp = () => handlePointerUp()
    const onTouchStart = (e: TouchEvent) => handlePointerDown(e.touches[0].clientX)
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handlePointerMove(e.touches[0].clientX, gameLoopRef)
    }
    const onTouchEnd = () => handlePointerUp()

    mount.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    mount.addEventListener('touchstart', onTouchStart, { passive: true })
    mount.addEventListener('touchmove', onTouchMove, { passive: false })
    mount.addEventListener('touchend', onTouchEnd)

    return () => {
      cancelAnimationFrame(rafId)
      gameLoop.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      window.removeEventListener('resize', handleResize)
      mount.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      mount.removeEventListener('touchstart', onTouchStart)
      mount.removeEventListener('touchmove', onTouchMove)
      mount.removeEventListener('touchend', onTouchEnd)
    }
  }, [gameKey, onScoreChange, onGameOver, handlePointerDown, handlePointerMove, handlePointerUp])

  return <div ref={mountRef} className="w-full h-full touch-none select-none" />
}
