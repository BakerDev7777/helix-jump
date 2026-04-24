import { createBall, updateBall, incrementCombo, resetCombo, addScore, type BallState } from '@/lib/game/Ball'
import { GRAVITY, MAX_FALL_SPEED } from '@/lib/game/constants'

describe('createBall', () => {
  it('creates ball with zero velocity and given Y position', () => {
    const ball = createBall(10)
    expect(ball.y).toBe(10)
    expect(ball.velocityY).toBe(0)
    expect(ball.comboCount).toBe(0)
    expect(ball.score).toBe(0)
  })
})

describe('updateBall', () => {
  it('applies gravity to velocity', () => {
    const ball = createBall(0)
    const updated = updateBall(ball, 1.0)
    expect(updated.velocityY).toBeCloseTo(GRAVITY)
  })

  it('updates Y position based on velocity', () => {
    const ball: BallState = { y: 5, velocityY: -2, comboCount: 0, score: 0 }
    const updated = updateBall(ball, 1.0)
    expect(updated.y).toBeLessThan(5)
  })

  it('caps velocity at MAX_FALL_SPEED', () => {
    const ball: BallState = { y: 0, velocityY: -100, comboCount: 0, score: 0 }
    const updated = updateBall(ball, 0.016)
    expect(updated.velocityY).toBeGreaterThanOrEqual(MAX_FALL_SPEED)
  })

  it('does not mutate input state', () => {
    const ball = createBall(5)
    updateBall(ball, 1.0)
    expect(ball.velocityY).toBe(0)
  })
})

describe('combo system', () => {
  it('increments combo count', () => {
    const ball = createBall(0)
    const after = incrementCombo(ball)
    expect(after.comboCount).toBe(1)
  })

  it('resets combo to zero', () => {
    const ball: BallState = { y: 0, velocityY: 0, comboCount: 3, score: 0 }
    const after = resetCombo(ball)
    expect(after.comboCount).toBe(0)
  })

  it('addScore x1 at combo 0', () => {
    const ball: BallState = { y: 0, velocityY: 0, comboCount: 0, score: 0 }
    expect(addScore(ball).score).toBe(1)
  })

  it('addScore x2 at combo 2', () => {
    const ball: BallState = { y: 0, velocityY: 0, comboCount: 2, score: 0 }
    expect(addScore(ball).score).toBe(2)
  })

  it('addScore x3 at combo 3', () => {
    const ball: BallState = { y: 0, velocityY: 0, comboCount: 3, score: 0 }
    expect(addScore(ball).score).toBe(3)
  })

  it('addScore capped at x5 for combo >= 5', () => {
    const ball: BallState = { y: 0, velocityY: 0, comboCount: 10, score: 0 }
    expect(addScore(ball).score).toBe(5)
  })
})
