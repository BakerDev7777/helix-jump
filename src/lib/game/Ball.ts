import { GRAVITY, MAX_FALL_SPEED } from './constants'

export interface BallState {
  y: number
  velocityY: number
  comboCount: number
  score: number
}

export function createBall(startY: number): BallState {
  return { y: startY, velocityY: 0, comboCount: 0, score: 0 }
}

export function updateBall(ball: BallState, delta: number): BallState {
  const newVelocity = Math.max(ball.velocityY + GRAVITY * delta, MAX_FALL_SPEED)
  const newY = ball.y + newVelocity * delta
  return { ...ball, y: newY, velocityY: newVelocity }
}

export function incrementCombo(ball: BallState): BallState {
  return { ...ball, comboCount: ball.comboCount + 1 }
}

export function resetCombo(ball: BallState): BallState {
  return { ...ball, comboCount: 0 }
}

export function addScore(ball: BallState): BallState {
  const multiplier = Math.min(Math.max(ball.comboCount, 1), 5)
  return { ...ball, score: ball.score + multiplier }
}
