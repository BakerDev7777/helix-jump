import * as THREE from 'three'
import {
  BALL_ORBIT_RADIUS, VISIBLE_RINGS, RING_SPACING,
  CAMERA_Y_OFFSET, CAMERA_Z_OFFSET, CAMERA_LERP, BALL_RADIUS,
} from './constants'
import { BallState, createBall, updateBall, incrementCombo, resetCombo, addScore } from './Ball'
import { RingData, generateRingData, createRingMesh, getDifficulty } from './Helix'
import { checkRingCollision } from './Physics'

export type GameState = 'idle' | 'playing' | 'gameover'

export interface GameLoopCallbacks {
  onScoreChange: (score: number, combo: number) => void
  onGameOver: (score: number) => void
}

export class GameLoop {
  private state: GameState = 'idle'
  private ball: BallState = createBall(0)
  private ballMesh: THREE.Mesh
  private rings: RingData[] = []
  private towerGroup: THREE.Group
  private poleMesh: THREE.Mesh
  private camera: THREE.PerspectiveCamera
  private scene: THREE.Scene
  private callbacks: GameLoopCallbacks
  private platformsPassed = 0
  private animFrameId = 0
  private lastTime = 0
  private cameraY = 0

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    callbacks: GameLoopCallbacks,
  ) {
    this.scene = scene
    this.camera = camera
    this.callbacks = callbacks

    this.towerGroup = new THREE.Group()
    scene.add(this.towerGroup)

    // Central blue pole — very tall so it's always visible as ball descends
    const poleGeo = new THREE.CylinderGeometry(0.22, 0.22, 1200, 16, 1)
    const poleMat = new THREE.MeshLambertMaterial({ color: '#3b82f6' })
    this.poleMesh = new THREE.Mesh(poleGeo, poleMat)
    this.poleMesh.position.y = -400
    scene.add(this.poleMesh)

    const geo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32)
    const mat = new THREE.MeshLambertMaterial({ map: this.createSoccerTexture() })
    this.ballMesh = new THREE.Mesh(geo, mat)
    scene.add(this.ballMesh)
  }

  private createSoccerTexture(): THREE.CanvasTexture {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, size, size)

    ctx.fillStyle = '#111111'

    const drawPatch = (cx: number, cy: number, r: number) => {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * (Math.PI / 180)
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
    }

    const s = size
    const patches: [number, number][] = [
      [s * 0.5, s * 0.5],
      [s * 0.5, s * 0.05],
      [s * 0.5, s * 0.95],
      [s * 0.05, s * 0.35],
      [s * 0.95, s * 0.35],
      [s * 0.05, s * 0.65],
      [s * 0.95, s * 0.65],
      [s * 0.22, s * 0.15],
      [s * 0.78, s * 0.15],
      [s * 0.22, s * 0.85],
      [s * 0.78, s * 0.85],
      [s * 0.15, s * 0.5],
      [s * 0.85, s * 0.5],
    ]

    for (const [x, y] of patches) {
      drawPatch(x, y, s * 0.085)
    }

    return new THREE.CanvasTexture(canvas)
  }

  start() {
    this.state = 'playing'
    this.ball = createBall(VISIBLE_RINGS * RING_SPACING)
    this.platformsPassed = 0
    this.rings = []
    this.towerGroup.rotation.y = 0
    this.cameraY = this.ball.y + CAMERA_Y_OFFSET

    // Immediately position camera at ball's starting location
    this.camera.position.set(0, this.cameraY, CAMERA_Z_OFFSET)
    this.camera.lookAt(0, this.ball.y + 2, 0)

    // Clear previous meshes
    while (this.towerGroup.children.length > 0) {
      this.towerGroup.remove(this.towerGroup.children[0])
    }

    // Generate initial rings
    for (let i = 0; i < VISIBLE_RINGS; i++) {
      const ring = generateRingData(i, 0)
      ring.mesh = createRingMesh(ring)
      this.towerGroup.add(ring.mesh)
      this.rings.push(ring)
    }

    // Make top 2 rings passable so ball doesn't immediately game-over
    for (let i = this.rings.length - 1; i >= Math.max(0, this.rings.length - 2); i--) {
      const ring = this.rings[i]
      ring.gapCenter = 0
      if (ring.mesh) {
        this.towerGroup.remove(ring.mesh)
        ;(ring.mesh.geometry as THREE.BufferGeometry).dispose()
        ;(ring.mesh.material as THREE.Material).dispose()
      }
      ring.mesh = createRingMesh(ring)
      this.towerGroup.add(ring.mesh)
    }

    this.lastTime = performance.now()
    this.animFrameId = requestAnimationFrame(this.loop)
  }

  private loop = (timestamp: number) => {
    if (this.state !== 'playing') return
    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.05)
    this.lastTime = timestamp
    this.update(delta)
    this.animFrameId = requestAnimationFrame(this.loop)
  }

  private update(delta: number) {
    this.ball = updateBall(this.ball, delta)
    this.ballMesh.position.set(BALL_ORBIT_RADIUS, this.ball.y, 0)

    for (const ring of this.rings) {
      if (ring.passed) continue

      const gapCenterWorld = ring.gapCenter + this.towerGroup.rotation.y
      const result = checkRingCollision(
        this.ball.y,
        ring.y,
        0,
        gapCenterWorld,
        ring.gapSize,
        0.14,
      )

      if (result === 'hit') {
        this.triggerGameOver()
        return
      }

      if (result === 'gap' && this.ball.y < ring.y) {
        ring.passed = true
        this.platformsPassed++
        this.ball = incrementCombo(this.ball)
        this.ball = addScore(this.ball)
        this.callbacks.onScoreChange(this.ball.score, this.ball.comboCount)
        this.recycleRing(ring)
      }
    }

    // Camera follows ball with lerp
    this.cameraY += (this.ball.y + CAMERA_Y_OFFSET - this.cameraY) * CAMERA_LERP
    this.camera.position.set(0, this.cameraY, CAMERA_Z_OFFSET)
    this.camera.lookAt(0, this.cameraY - CAMERA_Y_OFFSET + 2, 0)
  }

  private recycleRing(ring: RingData) {
    if (ring.mesh) {
      this.towerGroup.remove(ring.mesh)
      ;(ring.mesh.geometry as THREE.BufferGeometry).dispose()
      ;(ring.mesh.material as THREE.Material).dispose()
    }

    const idx = this.rings.indexOf(ring)
    if (idx !== -1) this.rings.splice(idx, 1)

    const lowestY = this.rings.length > 0
      ? Math.min(...this.rings.map((r) => r.y))
      : 0
    const newIndex = Math.round(lowestY / RING_SPACING) - 1
    const difficulty = getDifficulty(this.platformsPassed)
    const newRing = generateRingData(newIndex, difficulty)
    newRing.mesh = createRingMesh(newRing)
    this.towerGroup.add(newRing.mesh)
    this.rings.push(newRing)
  }

  private triggerGameOver() {
    this.state = 'gameover'
    cancelAnimationFrame(this.animFrameId)
    this.ball = resetCombo(this.ball)
    this.callbacks.onGameOver(this.ball.score)
  }

  rotateTower(deltaX: number) {
    if (this.state !== 'playing') return
    this.towerGroup.rotation.y += deltaX
  }

  dispose() {
    cancelAnimationFrame(this.animFrameId)
    for (const ring of this.rings) {
      if (ring.mesh) {
        ;(ring.mesh.geometry as THREE.BufferGeometry).dispose()
        ;(ring.mesh.material as THREE.Material).dispose()
      }
    }
    ;(this.ballMesh.geometry as THREE.BufferGeometry).dispose()
    ;(this.ballMesh.material as THREE.Material).dispose()
    ;(this.poleMesh.geometry as THREE.BufferGeometry).dispose()
    ;(this.poleMesh.material as THREE.Material).dispose()
    this.scene.remove(this.poleMesh)
  }
}
