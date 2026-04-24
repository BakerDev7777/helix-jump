import { normalizeAngle, isInGap, checkRingCollision } from '@/lib/game/Physics'

describe('normalizeAngle', () => {
  it('returns angle unchanged when within [-PI, PI]', () => {
    expect(normalizeAngle(1.0)).toBeCloseTo(1.0)
    expect(normalizeAngle(-1.0)).toBeCloseTo(-1.0)
  })

  it('wraps angle > PI back to negative range', () => {
    expect(normalizeAngle(Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1)
  })

  it('wraps angle < -PI to positive range', () => {
    expect(normalizeAngle(-Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1)
  })
})

describe('isInGap', () => {
  it('returns true when ball angle 0 is inside gap centered at 0', () => {
    expect(isInGap(0, 0, 1.0)).toBe(true)
  })

  it('returns true when ball is just inside the gap edge', () => {
    expect(isInGap(0, 0.49, 1.0)).toBe(true)
  })

  it('returns false when ball angle is outside gap', () => {
    expect(isInGap(0, Math.PI, 1.0)).toBe(false)
  })

  it('handles wrap-around near PI boundary', () => {
    expect(isInGap(0, Math.PI, 0.3)).toBe(false)
  })
})

describe('checkRingCollision', () => {
  const ringY = 0
  const ringHeight = 0.14
  const gapSize = 1.0
  const gapCenter = 0

  it('returns none when ball is far above ring', () => {
    expect(checkRingCollision(2.0, ringY, 0, gapCenter, gapSize, ringHeight)).toBe('none')
  })

  it('returns none when ball is far below ring', () => {
    expect(checkRingCollision(-2.0, ringY, 0, gapCenter, gapSize, ringHeight)).toBe('none')
  })

  it('returns gap when ball is at ring height and inside gap', () => {
    expect(checkRingCollision(0, ringY, 0, gapCenter, gapSize, ringHeight)).toBe('gap')
  })

  it('returns hit when ball is at ring height and outside gap', () => {
    expect(checkRingCollision(0, ringY, 0, Math.PI, gapSize, ringHeight)).toBe('hit')
  })

  it('returns none when ball has already passed through ring', () => {
    expect(checkRingCollision(-ringHeight - 0.5, ringY, 0, Math.PI, gapSize, ringHeight)).toBe('none')
  })
})
