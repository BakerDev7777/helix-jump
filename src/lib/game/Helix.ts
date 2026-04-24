import * as THREE from 'three'
import {
  RING_SPACING, INITIAL_GAP_SIZE, MIN_GAP_SIZE,
  GAP_SHRINK_PER_TIER, DIFFICULTY_TIER_SIZE, MAX_DIFFICULTY_TIERS,
  RING_OUTER_RADIUS, RING_INNER_RADIUS, RING_HEIGHT, RING_COLORS,
} from './constants'

export interface RingData {
  y: number
  gapCenter: number
  gapSize: number
  color: string
  passed: boolean
  mesh: THREE.Mesh | null
}

export function getDifficulty(platformsPassed: number): number {
  return Math.min(
    Math.floor(platformsPassed / DIFFICULTY_TIER_SIZE),
    MAX_DIFFICULTY_TIERS,
  )
}

export function generateRingData(index: number, difficulty: number): RingData {
  const gapSize = Math.max(
    INITIAL_GAP_SIZE - difficulty * GAP_SHRINK_PER_TIER,
    MIN_GAP_SIZE,
  )
  return {
    y: index * RING_SPACING,
    gapCenter: Math.random() * Math.PI * 2,
    gapSize,
    color: RING_COLORS[Math.floor(Math.random() * RING_COLORS.length)],
    passed: false,
    mesh: null,
  }
}

export function createRingMesh(ring: RingData): THREE.Mesh {
  const gapStart = ring.gapCenter - ring.gapSize / 2
  const arcAngle = Math.PI * 2 - ring.gapSize

  const shape = new THREE.Shape()
  shape.absarc(0, 0, RING_OUTER_RADIUS, gapStart + ring.gapSize, gapStart + ring.gapSize + arcAngle, false)

  const hole = new THREE.Path()
  hole.absarc(0, 0, RING_INNER_RADIUS, gapStart + ring.gapSize + arcAngle, gapStart + ring.gapSize, true)
  shape.holes.push(hole)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: RING_HEIGHT,
    bevelEnabled: false,
    curveSegments: 48,
  })
  geometry.rotateX(-Math.PI / 2)

  const material = new THREE.MeshLambertMaterial({ color: ring.color })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = ring.y
  return mesh
}
