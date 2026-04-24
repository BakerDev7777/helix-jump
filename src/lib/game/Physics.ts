import { RING_COLLISION_TOLERANCE } from './constants'

/** Normaliza ângulo para o intervalo [-PI, PI] */
export function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2)
  if (a > Math.PI) a -= Math.PI * 2
  if (a < -Math.PI) a += Math.PI * 2
  return a
}

/**
 * Verifica se o ângulo da bola está dentro do gap.
 * ballAngle: ângulo da bola em espaço mundo (sempre 0)
 * gapCenter: centro do gap em espaço mundo (ring.gapCenter + towerRotation)
 * gapSize: largura angular do gap em radianos
 */
export function isInGap(ballAngle: number, gapCenter: number, gapSize: number): boolean {
  const diff = Math.abs(normalizeAngle(ballAngle - gapCenter))
  return diff < gapSize / 2
}

/**
 * Verifica colisão da bola com um anel.
 * Returns: 'none' | 'gap' | 'hit'
 */
export function checkRingCollision(
  ballY: number,
  ringY: number,
  ballAngle: number,
  gapCenter: number,
  gapSize: number,
  ringHeight: number,
): 'none' | 'gap' | 'hit' {
  const halfH = ringHeight / 2 + RING_COLLISION_TOLERANCE
  if (ballY > ringY + halfH || ballY < ringY - halfH) return 'none'
  return isInGap(ballAngle, gapCenter, gapSize) ? 'gap' : 'hit'
}
