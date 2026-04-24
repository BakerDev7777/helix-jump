# Helix Jump — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a faithful Helix Jump clone for browsers (mobile-first) with Three.js 3D, infinite procedural tower, combo system, Supabase auth/scores, and Vercel deployment.

**Architecture:** Pure TypeScript game logic (`lib/game/`) with no React dependencies — Physics, Ball, Helix, and GameLoop are testable plain modules. A single `GameCanvas.tsx` mounts the Three.js renderer and wires touch/mouse input. React pages handle routing, auth overlays, and ranking UI.

**Tech Stack:** Next.js 14 App Router, Three.js, Supabase (Auth + Postgres + RLS), Tailwind CSS, Jest + ts-jest

---

## File Map

| File | Responsabilidade |
|------|-----------------|
| `src/lib/game/constants.ts` | Todas as constantes do jogo (raios, gravidade, dificuldade) |
| `src/lib/game/Physics.ts` | Funções puras de colisão e ângulo |
| `src/lib/game/Ball.ts` | Estado da bola e atualização de física |
| `src/lib/game/Helix.ts` | Dados dos anéis + criação de meshes Three.js |
| `src/lib/game/GameLoop.ts` | Máquina de estados e orquestração do loop |
| `src/lib/supabase.ts` | Clientes Supabase (browser + server) |
| `src/components/GameCanvas.tsx` | Cena Three.js, renderer, input táctil/mouse |
| `src/components/HUD.tsx` | Overlay de pontuação e combo |
| `src/components/GameOver.tsx` | Overlay de game over |
| `src/app/page.tsx` | Tela inicial |
| `src/app/game/page.tsx` | Página do jogo |
| `src/app/login/page.tsx` | Autenticação |
| `src/app/ranking/page.tsx` | Leaderboard global |
| `src/middleware.ts` | Refresh de sessão Supabase |
| `supabase/migrations/001_init.sql` | Tabelas profiles + scores + RLS |

---

## Task 1: Scaffold do Projeto Next.js

**Files:**
- Create: `package.json` (gerado pelo CLI)
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Criar projeto Next.js no diretório atual**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

Esperado: projeto criado com App Router e TypeScript.

- [ ] **Step 2: Instalar dependências do jogo**

```bash
npm install three @supabase/supabase-js @supabase/ssr
npm install --save-dev @types/three jest ts-jest @types/jest jest-environment-jsdom
```

- [ ] **Step 3: Configurar Jest**

Criar `jest.config.ts`:

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^three$': '<rootDir>/__mocks__/three.ts',
  },
  testPathPattern: ['src/__tests__/'],
}

export default config
```

- [ ] **Step 4: Criar mock do Three.js para testes**

Criar `__mocks__/three.ts`:

```typescript
// Mock mínimo — testes de lógica pura não precisam do renderer
const THREE = {
  Vector3: class { constructor(public x=0, public y=0, public z=0) {} },
  Group: class { add() {} rotation = { y: 0 } position = { y: 0 } },
  Mesh: class { position = { x: 0, y: 0, z: 0 }; visible = true },
  MeshLambertMaterial: class { color = 0; dispose() {} },
  SphereGeometry: class { dispose() {} },
  ExtrudeGeometry: class { rotateX() {} dispose() {} },
  Shape: class { absarc() {}; holes: any[] = []; closePath() {} },
  Path: class { absarc() {} },
  AmbientLight: class {},
  DirectionalLight: class { position = { set() {} } },
  PerspectiveCamera: class { position = { set() {} }; lookAt() {} updateProjectionMatrix() {} aspect = 1 },
  Scene: class { add() {} background = null },
  WebGLRenderer: class { setSize() {} setPixelRatio() {} render() {} dispose() {} domElement = document.createElement('canvas') },
  Color: class { constructor(public hex = 0) {} },
  PointLight: class { position = { set() {} } },
}

export default THREE
export const { Vector3, Group, Mesh, MeshLambertMaterial, SphereGeometry, ExtrudeGeometry, Shape, Path, AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer, Color, PointLight } = THREE as any
```

- [ ] **Step 5: Adicionar script de test ao package.json**

Editar `package.json` — adicionar em `"scripts"`:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Atualizar globals.css para mobile fullscreen**

Substituir conteúdo de `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  overflow: hidden;
  background: #0d001a;
}
```

- [ ] **Step 7: Atualizar layout.tsx com viewport mobile**

Substituir conteúdo de `src/app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Helix Jump',
  description: 'Clone do Helix Jump — jogo 3D de torre helicoidal',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js + Three.js + Supabase + Jest"
```

---

## Task 2: Constantes do Jogo

**Files:**
- Create: `src/lib/game/constants.ts`

- [ ] **Step 1: Criar arquivo de constantes**

Criar `src/lib/game/constants.ts`:

```typescript
// Geometria da torre
export const BALL_ORBIT_RADIUS = 1.8   // distância da bola ao centro da torre
export const RING_OUTER_RADIUS = 2.2   // raio externo dos anéis
export const RING_INNER_RADIUS = 0.3   // buraco central dos anéis
export const RING_HEIGHT = 0.14        // espessura de cada anel
export const RING_SPACING = 1.4        // espaçamento vertical entre anéis
export const VISIBLE_RINGS = 14        // anéis renderizados simultaneamente

// Dificuldade
export const INITIAL_GAP_SIZE = 1.15   // tamanho inicial do gap em radianos (~66°)
export const MIN_GAP_SIZE = 0.52       // gap mínimo (~30°)
export const GAP_SHRINK_PER_TIER = 0.05        // redução do gap a cada 10 plataformas
export const DIFFICULTY_TIER_SIZE = 10         // plataformas por tier de dificuldade
export const MAX_DIFFICULTY_TIERS = 12         // teto de dificuldade (~100 plataformas)

// Física
export const GRAVITY = -18             // aceleração gravitacional (unidades/s²)
export const MAX_FALL_SPEED = -22      // velocidade máxima de queda
export const BALL_RADIUS = 0.22        // raio visual da esfera
export const RING_COLLISION_TOLERANCE = 0.08   // margem de tolerância vertical

// Câmera
export const CAMERA_Y_OFFSET = 9      // câmera acima da bola
export const CAMERA_Z_OFFSET = 7      // câmera atrás da bola
export const CAMERA_LERP = 0.08       // suavização do seguimento da câmera

// Rotação
export const ROTATION_SENSITIVITY = 0.012  // sensibilidade do arrastar (rad/px)

// Cores das plataformas
export const RING_COLORS = [
  '#e63946', '#f4a261', '#2a9d8f', '#e9c46a',
  '#a855f7', '#06b6d4', '#f97316', '#ec4899',
  '#84cc16', '#3b82f6',
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/game/constants.ts
git commit -m "feat: game constants"
```

---

## Task 3: Physics.ts — Detecção de Colisão (TDD)

**Files:**
- Create: `src/__tests__/Physics.test.ts`
- Create: `src/lib/game/Physics.ts`

- [ ] **Step 1: Escrever testes que falham**

Criar `src/__tests__/Physics.test.ts`:

```typescript
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
  // Ball is always at angle 0 in world space.
  // gapCenter is in world space (ring.gapAngle + towerRotation).
  // gapSize is the angular width of the opening.

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
    // Gap centered just past -PI, ball at 0 should not be in it
    expect(isInGap(0, Math.PI, 0.3)).toBe(false)
  })
})

describe('checkRingCollision', () => {
  const ringY = 0
  const ringHeight = 0.14
  const gapSize = 1.0
  const gapCenter = 0  // gap aligned with ball (angle 0)

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

  it('returns none when ball has already passed through ring (below)', () => {
    expect(checkRingCollision(-ringHeight - 0.5, ringY, 0, Math.PI, gapSize, ringHeight)).toBe('none')
  })
})
```

- [ ] **Step 2: Executar testes para confirmar que falham**

```bash
npx jest Physics --no-coverage
```

Esperado: FAIL — `Cannot find module '@/lib/game/Physics'`

- [ ] **Step 3: Implementar Physics.ts**

Criar `src/lib/game/Physics.ts`:

```typescript
import { RING_COLLISION_TOLERANCE } from './constants'

/** Normaliza ângulo para o intervalo [-PI, PI] */
export function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2)
  if (a > Math.PI) a -= Math.PI * 2
  if (a < -Math.PI) a += Math.PI * 2
  return a
}

/**
 * Verifica se o ângulo da bola (sempre 0 em espaço mundo) está dentro do gap.
 * @param ballAngle  ângulo da bola em espaço mundo (sempre 0)
 * @param gapCenter  centro do gap em espaço mundo (gapAngle + towerRotation)
 * @param gapSize    largura angular do gap em radianos
 */
export function isInGap(ballAngle: number, gapCenter: number, gapSize: number): boolean {
  const diff = Math.abs(normalizeAngle(ballAngle - gapCenter))
  return diff < gapSize / 2
}

/**
 * Verifica colisão da bola com um anel.
 * @returns 'none' = sem colisão | 'gap' = passou pelo buraco | 'hit' = colidiu (game over)
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
```

- [ ] **Step 4: Executar testes para confirmar que passam**

```bash
npx jest Physics --no-coverage
```

Esperado: PASS (todos os testes verdes)

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/Physics.test.ts src/lib/game/Physics.ts
git commit -m "feat: physics collision detection with tests"
```

---

## Task 4: Ball.ts — Estado da Bola (TDD)

**Files:**
- Create: `src/__tests__/Ball.test.ts`
- Create: `src/lib/game/Ball.ts`

- [ ] **Step 1: Escrever testes que falham**

Criar `src/__tests__/Ball.test.ts`:

```typescript
import { createBall, updateBall, incrementCombo, resetCombo, addScore, type BallState } from '@/lib/game/Ball'
import { GRAVITY, MAX_FALL_SPEED } from '@/lib/game/constants'

describe('createBall', () => {
  it('creates ball with zero velocity and default position', () => {
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
    // y += velocityY * delta + 0.5 * gravity * delta^2
    expect(updated.y).toBeLessThan(5)
  })

  it('caps velocity at MAX_FALL_SPEED', () => {
    const ball: BallState = { y: 0, velocityY: -100, comboCount: 0, score: 0 }
    const updated = updateBall(ball, 0.016)
    expect(updated.velocityY).toBeGreaterThanOrEqual(MAX_FALL_SPEED)
  })

  it('does not mutate input state', () => {
    const ball = createBall(5)
    const updated = updateBall(ball, 1.0)
    expect(ball.velocityY).toBe(0)
    expect(updated).not.toBe(ball)
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

  it('adds score with combo multiplier', () => {
    // combo 0-1 = x1, combo 2 = x2, combo 3 = x3, capped at x5
    const ball0: BallState = { y: 0, velocityY: 0, comboCount: 0, score: 0 }
    expect(addScore(ball0).score).toBe(1)

    const ball2: BallState = { y: 0, velocityY: 0, comboCount: 2, score: 0 }
    expect(addScore(ball2).score).toBe(2)

    const ball3: BallState = { y: 0, velocityY: 0, comboCount: 3, score: 0 }
    expect(addScore(ball3).score).toBe(3)

    const ball10: BallState = { y: 0, velocityY: 0, comboCount: 10, score: 0 }
    expect(addScore(ball10).score).toBe(5)
  })
})
```

- [ ] **Step 2: Executar testes para confirmar que falham**

```bash
npx jest Ball --no-coverage
```

Esperado: FAIL — `Cannot find module '@/lib/game/Ball'`

- [ ] **Step 3: Implementar Ball.ts**

Criar `src/lib/game/Ball.ts`:

```typescript
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
```

- [ ] **Step 4: Executar testes para confirmar que passam**

```bash
npx jest Ball --no-coverage
```

Esperado: PASS

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/Ball.test.ts src/lib/game/Ball.ts
git commit -m "feat: ball state and physics with tests"
```

---

## Task 5: Helix.ts — Dados dos Anéis (TDD)

**Files:**
- Create: `src/__tests__/Helix.test.ts`
- Create: `src/lib/game/Helix.ts`

- [ ] **Step 1: Escrever testes que falham**

Criar `src/__tests__/Helix.test.ts`:

```typescript
import { generateRingData, getDifficulty, type RingData } from '@/lib/game/Helix'
import {
  INITIAL_GAP_SIZE, MIN_GAP_SIZE, RING_SPACING,
  GAP_SHRINK_PER_TIER, DIFFICULTY_TIER_SIZE, MAX_DIFFICULTY_TIERS,
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
  it('generates a ring at the correct Y position', () => {
    const ring = generateRingData(0, 0)
    expect(ring.y).toBeCloseTo(0)

    const ring5 = generateRingData(5, 0)
    expect(ring5.y).toBeCloseTo(5 * RING_SPACING)
  })

  it('generates gap within [0, 2PI]', () => {
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
    const ring1 = generateRingData(0, 3)
    expect(ring1.gapSize).toBeLessThan(ring0.gapSize)
  })

  it('never goes below MIN_GAP_SIZE', () => {
    const ring = generateRingData(0, MAX_DIFFICULTY_TIERS + 10)
    expect(ring.gapSize).toBeGreaterThanOrEqual(MIN_GAP_SIZE)
  })

  it('marks ring as not passed by default', () => {
    const ring = generateRingData(0, 0)
    expect(ring.passed).toBe(false)
  })
})
```

- [ ] **Step 2: Executar testes para confirmar que falham**

```bash
npx jest Helix --no-coverage
```

Esperado: FAIL

- [ ] **Step 3: Implementar Helix.ts (dados apenas)**

Criar `src/lib/game/Helix.ts`:

```typescript
import * as THREE from 'three'
import {
  RING_SPACING, INITIAL_GAP_SIZE, MIN_GAP_SIZE,
  GAP_SHRINK_PER_TIER, DIFFICULTY_TIER_SIZE, MAX_DIFFICULTY_TIERS,
  RING_OUTER_RADIUS, RING_INNER_RADIUS, RING_HEIGHT, RING_COLORS,
} from './constants'

export interface RingData {
  y: number
  gapCenter: number   // ângulo do centro do gap no espaço local do anel (0 a 2PI)
  gapSize: number     // largura do gap em radianos
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
```

- [ ] **Step 4: Executar testes para confirmar que passam**

```bash
npx jest Helix --no-coverage
```

Esperado: PASS

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/Helix.test.ts src/lib/game/Helix.ts
git commit -m "feat: helix ring data generation with tests"
```

---

## Task 6: GameLoop.ts — Máquina de Estados

**Files:**
- Create: `src/lib/game/GameLoop.ts`

- [ ] **Step 1: Criar GameLoop.ts**

Criar `src/lib/game/GameLoop.ts`:

```typescript
import * as THREE from 'three'
import {
  BALL_ORBIT_RADIUS, VISIBLE_RINGS, RING_SPACING,
  CAMERA_Y_OFFSET, CAMERA_Z_OFFSET, CAMERA_LERP,
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
  private cameraTargetY = 0

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

    // Bola
    const geo = new THREE.SphereGeometry(0.22, 24, 24)
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

    // Limpa anéis anteriores
    while (this.towerGroup.children.length > 0) {
      this.towerGroup.remove(this.towerGroup.children[0])
    }

    // Gera anéis iniciais
    for (let i = 0; i < VISIBLE_RINGS; i++) {
      this.addRingAtBottom(i)
    }

    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  private addRingAtBottom(index: number) {
    const difficulty = getDifficulty(this.platformsPassed)
    const lowestRingIndex = this.rings.length > 0
      ? Math.min(...this.rings.map((r) => Math.round(r.y / RING_SPACING)))
      : 0
    const ringIndex = index !== undefined ? index : lowestRingIndex - 1
    const ring = generateRingData(ringIndex, difficulty)
    ring.mesh = createRingMesh(ring)
    this.towerGroup.add(ring.mesh)
    this.rings.push(ring)
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

    // Posição da bola no mundo
    this.ballMesh.position.set(BALL_ORBIT_RADIUS, this.ball.y, 0)

    // Verificar colisões
    for (const ring of this.rings) {
      if (ring.passed) continue

      const gapCenterWorld = ring.gapCenter + this.towerGroup.rotation.y
      const result = checkRingCollision(
        this.ball.y,
        ring.y,
        0, // ballAngle fixo em 0
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

        // Reciclar anel passado: mover para baixo da torre
        this.recycleRing(ring)
      }
    }

    // Câmera segue bola suavemente
    this.cameraTargetY = this.ball.y
    const camY = this.camera.position.y + (this.cameraTargetY + CAMERA_Y_OFFSET - this.camera.position.y) * CAMERA_LERP
    this.camera.position.set(0, camY, CAMERA_Z_OFFSET)
    this.camera.lookAt(0, camY - CAMERA_Y_OFFSET + 2, 0)
  }

  private recycleRing(ring: RingData) {
    // Remove anel da cena e recria abaixo do mais baixo
    if (ring.mesh) {
      this.towerGroup.remove(ring.mesh)
      ring.mesh.geometry.dispose()
      ;(ring.mesh.material as THREE.Material).dispose()
    }
    const idx = this.rings.indexOf(ring)
    this.rings.splice(idx, 1)

    const lowestY = Math.min(...this.rings.map((r) => r.y))
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
    this.towerGroup.children.forEach((child) => {
      const mesh = child as THREE.Mesh
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })
    this.ballMesh.geometry.dispose()
    ;(this.ballMesh.material as THREE.Material).dispose()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/game/GameLoop.ts
git commit -m "feat: game loop state machine"
```

---

## Task 7: Supabase — Migrations e Cliente

**Files:**
- Create: `supabase/migrations/001_init.sql`
- Create: `src/lib/supabase.ts`
- Create: `.env.local`

- [ ] **Step 1: Criar migration SQL**

Criar `supabase/migrations/001_init.sql`:

```sql
-- Perfil do usuário (estende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    text UNIQUE NOT NULL,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
);

-- Pontuações por partida
CREATE TABLE IF NOT EXISTS scores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score       int NOT NULL CHECK (score >= 0),
  combo_max   int NOT NULL DEFAULT 0 CHECK (combo_max >= 0),
  played_at   timestamptz DEFAULT now()
);

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: leitura própria" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: escrita própria" ON profiles
  FOR ALL USING (auth.uid() = id);

-- RLS: scores
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores: inserção própria" ON scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scores: leitura pública" ON scores
  FOR SELECT USING (true);

-- Criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 2: Criar cliente Supabase**

Criar `src/lib/supabase.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

// Tipos do banco
export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number
  combo_max: number
  played_at: string
}

export interface RankingEntry {
  user_id: string
  username: string
  best_score: number
  rank: number
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function saveScore(score: number, comboMax: number): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('scores').insert({ user_id: user.id, score, combo_max: comboMax })
}

export async function getRanking(): Promise<RankingEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('scores')
    .select('user_id, score, profiles(username)')
    .order('score', { ascending: false })

  if (!data) return []

  // Agrupar: melhor score por usuário
  const map = new Map<string, RankingEntry>()
  for (const row of data) {
    const profile = row.profiles as unknown as { username: string }
    if (!map.has(row.user_id) || map.get(row.user_id)!.best_score < row.score) {
      map.set(row.user_id, {
        user_id: row.user_id,
        username: profile?.username ?? 'Anônimo',
        best_score: row.score,
        rank: 0,
      })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.best_score - a.best_score)
    .slice(0, 100)
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}

export function getBestScoreLocal(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem('helix_best_score') ?? '0', 10)
}

export function saveBestScoreLocal(score: number): void {
  const current = getBestScoreLocal()
  if (score > current) localStorage.setItem('helix_best_score', String(score))
}
```

- [ ] **Step 3: Criar .env.local**

Criar `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Preencher com valores reais do dashboard Supabase:** Settings → API.

- [ ] **Step 4: Criar middleware Supabase**

Criar `src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/lib/supabase.ts src/middleware.ts .env.local
git commit -m "feat: supabase client, migrations, middleware"
```

---

## Task 8: GameCanvas.tsx — Cena Three.js

**Files:**
- Create: `src/components/GameCanvas.tsx`

- [ ] **Step 1: Criar GameCanvas.tsx**

Criar `src/components/GameCanvas.tsx`:

```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GameLoop } from '@/lib/game/GameLoop'
import { CAMERA_Y_OFFSET, CAMERA_Z_OFFSET } from '@/lib/game/constants'

interface GameCanvasProps {
  onScoreChange: (score: number, combo: number) => void
  onGameOver: (score: number) => void
  gameKey: number  // incrementar para reiniciar
}

export default function GameCanvas({ onScoreChange, onGameOver, gameKey }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const isDragging = useRef(false)
  const lastTouchX = useRef(0)

  const handlePointerDown = useCallback((x: number) => {
    isDragging.current = true
    lastTouchX.current = x
  }, [])

  const handlePointerMove = useCallback((x: number) => {
    if (!isDragging.current || !gameLoopRef.current) return
    const deltaX = x - lastTouchX.current
    gameLoopRef.current.rotateTower(deltaX * 0.012)
    lastTouchX.current = x
  }, [])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Renderer
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    const renderer = new THREE.WebGLRenderer({
      antialias: pixelRatio <= 1,
      alpha: false,
    })
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor('#0d001a')
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Cena
    const scene = new THREE.Scene()

    // Luzes
    scene.add(new THREE.AmbientLight('#ffffff', 0.6))
    const dirLight = new THREE.DirectionalLight('#ffffff', 0.8)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    // Câmera
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, CAMERA_Y_OFFSET, CAMERA_Z_OFFSET)
    camera.lookAt(0, 0, 0)

    // Game loop
    const loop = new GameLoop(scene, camera, { onScoreChange, onGameOver })
    gameLoopRef.current = loop
    loop.start()

    // Render loop (separado do game loop para performance)
    let rafId: number
    const renderLoop = () => {
      rafId = requestAnimationFrame(renderLoop)
      renderer.render(scene, camera)
    }
    renderLoop()

    // Resize
    const handleResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Pausa ao perder foco
    const handleVisibility = () => {
      // GameLoop já protege contra delta grandes (max 50ms)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(rafId)
      loop.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [gameKey, onScoreChange, onGameOver])

  return (
    <div
      ref={mountRef}
      className="w-full h-full touch-none"
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => { e.preventDefault(); handlePointerMove(e.touches[0].clientX) }}
      onTouchEnd={handlePointerUp}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameCanvas.tsx
git commit -m "feat: Three.js game canvas with touch/mouse input"
```

---

## Task 9: HUD.tsx e GameOver.tsx

**Files:**
- Create: `src/components/HUD.tsx`
- Create: `src/components/GameOver.tsx`

- [ ] **Step 1: Criar HUD.tsx**

Criar `src/components/HUD.tsx`:

```typescript
interface HUDProps {
  score: number
  combo: number
}

export default function HUD({ score, combo }: HUDProps) {
  return (
    <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-8 pointer-events-none">
      <span className="text-white text-5xl font-bold drop-shadow-lg tabular-nums">
        {score}
      </span>
      {combo >= 2 && (
        <span className="text-orange-400 text-xl font-semibold mt-1 animate-pulse">
          x{Math.min(combo, 5)} COMBO!
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Criar GameOver.tsx**

Criar `src/components/GameOver.tsx`:

```typescript
interface GameOverProps {
  score: number
  bestScore: number
  onRestart: () => void
  onHome: () => void
}

export default function GameOver({ score, bestScore, onRestart, onHome }: GameOverProps) {
  const isNewRecord = score >= bestScore && score > 0

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 px-8 py-10 rounded-2xl bg-[#1a0533]/90 border border-purple-800 w-80">
        <h2 className="text-white text-3xl font-bold">Game Over</h2>

        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-sm uppercase tracking-widest">Pontuação</span>
          <span className="text-white text-6xl font-bold tabular-nums">{score}</span>
          {isNewRecord && (
            <span className="text-yellow-400 text-sm font-semibold">🏆 Novo Recorde!</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-500 text-xs uppercase tracking-widest">Melhor</span>
          <span className="text-purple-300 text-2xl font-bold tabular-nums">
            {Math.max(score, bestScore)}
          </span>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-lg font-bold transition-colors"
        >
          Jogar Novamente
        </button>

        <button
          onClick={onHome}
          className="w-full py-3 rounded-xl border border-purple-700 text-purple-300 text-base font-medium hover:bg-purple-900/40 transition-colors"
        >
          Início
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/HUD.tsx src/components/GameOver.tsx
git commit -m "feat: HUD and GameOver overlay components"
```

---

## Task 10: Página do Jogo

**Files:**
- Create: `src/app/game/page.tsx`

- [ ] **Step 1: Criar game/page.tsx**

Criar `src/app/game/page.tsx`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import HUD from '@/components/HUD'
import GameOver from '@/components/GameOver'
import { saveScore, saveBestScoreLocal, getBestScoreLocal } from '@/lib/supabase'

// Three.js só roda no browser
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

export default function GamePage() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => getBestScoreLocal())
  const [gameKey, setGameKey] = useState(0)

  const handleScoreChange = useCallback((newScore: number, newCombo: number) => {
    setScore(newScore)
    setCombo(newCombo)
  }, [])

  const handleGameOver = useCallback(async (endScore: number) => {
    setFinalScore(endScore)
    setIsGameOver(true)
    saveBestScoreLocal(endScore)
    setBestScore((prev) => Math.max(prev, endScore))
    await saveScore(endScore, combo)
  }, [combo])

  const handleRestart = useCallback(() => {
    setScore(0)
    setCombo(0)
    setIsGameOver(false)
    setGameKey((k) => k + 1)
  }, [])

  return (
    <div className="relative w-full h-dvh bg-[#0d001a] overflow-hidden">
      <GameCanvas
        gameKey={gameKey}
        onScoreChange={handleScoreChange}
        onGameOver={handleGameOver}
      />
      <HUD score={score} combo={combo} />
      {isGameOver && (
        <GameOver
          score={finalScore}
          bestScore={bestScore}
          onRestart={handleRestart}
          onHome={() => router.push('/')}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/game/page.tsx
git commit -m "feat: game page with canvas, HUD, and game over"
```

---

## Task 11: Tela Inicial

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Step 1: Criar tela inicial**

Substituir `src/app/page.tsx`:

```typescript
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getBestScoreLocal } from '@/lib/supabase'

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-[#0d001a] gap-8 px-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-6xl font-black tracking-tight text-white">
          <span className="text-purple-400">H</span>ELIX
        </div>
        <div className="text-3xl font-black tracking-tight text-white">
          <span className="text-pink-500">J</span>UMP
        </div>
        <div className="mt-1 text-gray-500 text-sm">Gire a torre. Não toque as plataformas.</div>
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/game"
          className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xl font-bold text-center transition-colors shadow-lg shadow-purple-900/50"
        >
          ▶ Jogar
        </Link>
        <Link
          href="/ranking"
          className="w-full py-4 rounded-2xl border border-purple-700 text-purple-300 text-base font-medium text-center hover:bg-purple-900/30 transition-colors"
        >
          🏆 Ranking
        </Link>
        {user ? (
          <div className="text-center text-gray-400 text-sm pt-1">
            Logado como <span className="text-purple-300">{user.email}</span>
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full py-4 rounded-2xl border border-gray-700 text-gray-400 text-base font-medium text-center hover:bg-gray-900/40 transition-colors"
          >
            👤 Entrar
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: home screen with logo and navigation"
```

---

## Task 12: Login

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`

- [ ] **Step 1: Criar server actions de auth**

Criar `src/app/login/actions.ts`:

```typescript
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    },
  )
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await getSupabase()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/')
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await getSupabase()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/')
}

export async function signInWithGoogle() {
  const supabase = await getSupabase()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })
  if (error || !data.url) return { error: 'Erro ao conectar com Google' }
  redirect(data.url)
}

export async function signOut() {
  const supabase = await getSupabase()
  await supabase.auth.signOut()
  redirect('/')
}
```

- [ ] **Step 2: Criar página de login**

Criar `src/app/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = isSignUp ? await signUpWithEmail(fd) : await signInWithEmail(fd)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-[#0d001a] px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-white text-2xl font-bold text-center">
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-lg transition-colors"
          >
            {loading ? '...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <button
          onClick={() => signInWithGoogle()}
          className="w-full py-4 rounded-xl border border-gray-600 text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <span>G</span> Continuar com Google
        </button>

        <button
          onClick={() => setIsSignUp((v) => !v)}
          className="text-gray-400 text-sm text-center hover:text-purple-300 transition-colors"
        >
          {isSignUp ? 'Já tenho conta — Entrar' : 'Não tenho conta — Criar'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="text-gray-600 text-sm text-center hover:text-gray-400 transition-colors"
        >
          Continuar sem conta
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar callback de OAuth**

Criar `src/app/auth/callback/route.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/login', request.url))

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    },
  )

  await supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(new URL('/', request.url))
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/login/ src/app/auth/
git commit -m "feat: login page with email/password and Google OAuth"
```

---

## Task 13: Ranking

**Files:**
- Create: `src/app/ranking/page.tsx`

- [ ] **Step 1: Criar ranking/page.tsx**

Criar `src/app/ranking/page.tsx`:

```typescript
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRanking } from '@/lib/supabase'

export const revalidate = 60  // revalida a cada 60s

export default async function RankingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const ranking = await getRanking()

  const medal = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`

  return (
    <div className="flex flex-col h-dvh bg-[#0d001a]">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-10 pb-4">
        <Link href="/" className="text-gray-400 hover:text-white text-2xl">←</Link>
        <h1 className="text-white text-xl font-bold">Ranking Global</h1>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {ranking.length === 0 && (
          <p className="text-gray-500 text-center mt-16">Nenhuma pontuação ainda. Seja o primeiro!</p>
        )}
        <div className="flex flex-col gap-2">
          {ranking.map((entry) => {
            const isCurrentUser = entry.user_id === user?.id
            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                  isCurrentUser
                    ? 'bg-purple-900/60 border border-purple-500'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{medal(entry.rank)}</span>
                  <span className={`font-medium ${isCurrentUser ? 'text-purple-200' : 'text-white'}`}>
                    {entry.username}
                    {isCurrentUser && <span className="text-purple-400 text-xs ml-1">(você)</span>}
                  </span>
                </div>
                <span className="text-white font-bold tabular-nums">{entry.best_score}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/ranking/page.tsx
git commit -m "feat: ranking page with top 100 global scores"
```

---

## Task 14: Variáveis de Ambiente e Deploy Vercel

**Files:**
- Create: `.env.local` (preenchido com valores reais)
- Modify: `.gitignore`

- [ ] **Step 1: Garantir .gitignore correto**

Verificar que `.gitignore` contém:

```
.env.local
.env*.local
```

- [ ] **Step 2: Adicionar NEXT_PUBLIC_SITE_URL ao .env.local**

Adicionar em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

- [ ] **Step 3: Testar build local**

```bash
npm run build
```

Esperado: build concluído sem erros TypeScript.

- [ ] **Step 4: Verificar testes**

```bash
npx jest --no-coverage
```

Esperado: todos os testes passando.

- [ ] **Step 5: Fazer push e conectar ao Vercel**

```bash
git add -A
git commit -m "feat: complete helix jump v1"
```

No dashboard Vercel:
1. New Project → importar repositório GitHub
2. Framework Preset: Next.js (auto-detectado)
3. Environment Variables: adicionar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
4. Deploy

- [ ] **Step 6: Aplicar migrations no Supabase**

No dashboard Supabase → SQL Editor → colar e executar o conteúdo de `supabase/migrations/001_init.sql`.

- [ ] **Step 7: Configurar Google OAuth no Supabase**

No dashboard Supabase → Authentication → Providers → Google:
- Ativar Google
- Adicionar Client ID e Secret do Google Cloud Console
- Authorized redirect URI: `https://SEU_PROJETO.supabase.co/auth/v1/callback`

- [ ] **Step 8: Commit final**

```bash
git add .
git commit -m "chore: production configuration"
git push
```

---

## Cobertura da Spec

| Requisito | Task |
|-----------|------|
| 3D com Three.js | Task 8 (GameCanvas) + Task 6 (GameLoop) |
| Torre helicoidal procedural | Task 5 (Helix.ts) |
| Física da bola (gravidade) | Task 4 (Ball.ts) |
| Detecção de colisão (gap/hit) | Task 3 (Physics.ts) |
| Sistema de combo (x2-x5) | Task 4 (Ball.ts) |
| Controle por toque/mouse | Task 8 (GameCanvas) |
| Modo infinito com reciclagem | Task 6 (GameLoop) |
| Progressão de dificuldade | Task 5 (Helix) + constantes Task 2 |
| HUD com pontuação e combo | Task 9 (HUD.tsx) |
| Game Over com recorde | Task 9 (GameOver.tsx) + Task 10 |
| Câmera seguindo bola (lerp) | Task 6 (GameLoop) |
| Performance mobile (60fps) | Task 8 (antialias, pixelRatio) |
| Supabase Auth (email + Google) | Task 7 + Task 12 |
| Tabelas profiles + scores + RLS | Task 7 (migration) |
| Ranking global top 100 | Task 7 (supabase.ts) + Task 13 |
| Score local (localStorage) | Task 7 (supabase.ts) |
| Tela inicial | Task 11 |
| Deploy Vercel | Task 14 |
