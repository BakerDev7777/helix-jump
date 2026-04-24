import {
  generateRingData, getDifficulty, type RingData,
} from '@/lib/game/Helix'
import {
  INITIAL_GAP_SIZE, MIN_GAP_SIZE, RING_SPACING,
  DIFFICULTY_TIER_SIZE, MAX_DIFFICULTY_TIERS,
} from '@/lib/game/constants'

describe('getDifficulty', () => {
  it('returns 0 at start', () => {
    expect(getDifficulty(0)).toBe(0)
  })

  it('increases every DIFFICULTY_TIER_SIZE platforms', () => {
    expect(getDifficulty(DIFFICULTY_TIER_SIZE)).toBe(1)
    expect(getDifficulty(DIFFICULTY_TIER_SIZE * 2)).toBe(2)
  })

  it('caps at MAX_DIFFICULTY_TIERS', () => {
    expect(getDifficulty(9999)).toBe(MAX_DIFFICULTY_TIERS)
  })
})

describe('generateRingData', () => {
  it('generates ring at correct Y position', () => {
    const ring = generateRingData(0, 0)
    expect(ring.y).toBeCloseTo(0)

    const ring5 = generateRingData(5, 0)
    expect(ring5.y).toBeCloseTo(5 * RING_SPACING)
  })

  it('generates gapCenter within [0, 2PI]', () => {
    for (let i = 0; i < 20; i++) {
      const ring = generateRingData(i, 0)
      expect(ring.gapCenter).toBeGreaterThanOrEqual(0)
      expect(ring.gapCenter).toBeLessThan(Math.PI * 2)
    }
  })

  it('uses INITIAL_GAP_SIZE at difficulty 0', () => {
    const ring = generateRingData(0, 0)
    expect(ring.gapSize).toBeCloseTo(INITIAL_GAP_SIZE)
  })

  it('shrinks gap with higher difficulty', () => {
    const ring0 = generateRingData(0, 0)
    const ring3 = generateRingData(0, 3)
    expect(ring3.gapSize).toBeLessThan(ring0.gapSize)
  })

  it('never goes below MIN_GAP_SIZE', () => {
    const ring = generateRingData(0, MAX_DIFFICULTY_TIERS + 10)
    expect(ring.gapSize).toBeGreaterThanOrEqual(MIN_GAP_SIZE)
  })

  it('starts with passed = false and mesh = null', () => {
    const ring = generateRingData(0, 0)
    expect(ring.passed).toBe(false)
    expect(ring.mesh).toBeNull()
  })
})
