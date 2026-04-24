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

    const geo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24)
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' })
    this.ballMesh = new THREE.Mesh(geo, mat)
    scene.add(this.ballMesh)
  }

  start() {
    this.state = 'playing'
    this.ball = createBall(VISIBLE_RINGS * RING_SPACING)
    this.platformsPassed = 0
    this.rings = []
    this.towerGroup.rotation.y = 0
    this.cameraY = this.ball.y + CAMERA_Y_OFFSET

    // Clear previous meshes
    while (this.towerGroup.children.length > 0) {
      this.towerGroup.remove(this.towerGroup.children[0])
    }

    // Generate initial rings from bottom (index 0) to top
    for (let i = 0; i < VISIBLE_RINGS; i++) {
      const ring = generateRingData(i, 0)
      ring.mesh = createRingMesh(ring)
      this.towerGroup.add(ring.mesh)
      this.rings.push(ring)
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
  }
}
