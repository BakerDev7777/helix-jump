'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import HUD from '@/components/HUD'
import GameOver from '@/components/GameOver'
import BetHeader from '@/components/BetHeader'
import StartScreen from '@/components/StartScreen'
import CashoutModal from '@/components/CashoutModal'
import { saveScore, saveBestScoreLocal, getBestScoreLocal } from '@/lib/supabase'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

// Bet config — wire to backend in production
const BET_CENTS = 500            // R$ 5,00
const PER_PLATFORM_CENTS = 200   // R$ 2,00 per platform
const MULTIPLIER = 5             // Meta 5x
const TARGET_CENTS = BET_CENTS * MULTIPLIER

export default function GamePage() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => getBestScoreLocal())
  const [gameKey, setGameKey] = useState(0)
  const [started, setStarted] = useState(false)
  const [cashedOut, setCashedOut] = useState<{ profit: number; total: number } | null>(null)
  const [showHint, setShowHint] = useState(true)

  const handleScoreChange = useCallback((newScore: number, newCombo: number) => {
    setScore(newScore)
    setCombo(newCombo)
    if (newScore > 0) setShowHint(false)
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
    setShowHint(true)
    setGameKey((k) => k + 1)
  }, [])

  const handleStart = useCallback(() => {
    setStarted(true)
  }, [])

  const handleExit = useCallback(() => {
    router.push('/')
  }, [router])

  const handleCashout = useCallback(() => {
    const profitCents = score * PER_PLATFORM_CENTS
    const totalCents = BET_CENTS + profitCents
    setCashedOut({ profit: profitCents, total: totalCents })
    setTimeout(() => {
      router.push('/')
    }, 2200)
  }, [score, router])

  return (
    <div
      className="relative w-full h-dvh overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/stadium.jpg')", backgroundColor: '#0d4a2a' }}
    >
      {started && (
        <GameCanvas
          gameKey={gameKey}
          onScoreChange={handleScoreChange}
          onGameOver={handleGameOver}
        />
      )}

      <BetHeader
        betCents={BET_CENTS}
        targetCents={TARGET_CENTS}
        perPlatformCents={PER_PLATFORM_CENTS}
        platformsPassed={score}
        multiplier={MULTIPLIER}
        onExit={handleExit}
        onCashout={handleCashout}
      />

      <HUD score={score} combo={combo} />

      {started && showHint && !isGameOver && !cashedOut && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[#1a1a2e]/45 text-lg pointer-events-none select-none"
          style={{ animation: 'blink-hint 1.5s ease-in-out infinite' }}>
          ← Arraste →
          <style>{`@keyframes blink-hint { 0%,100% { opacity:0.4 } 50% { opacity:1 } }`}</style>
        </div>
      )}

      {!started && <StartScreen onStart={handleStart} />}

      {isGameOver && !cashedOut && (
        <GameOver
          score={finalScore}
          bestScore={bestScore}
          onRestart={handleRestart}
          onHome={() => router.push('/')}
        />
      )}

      {cashedOut && (
        <CashoutModal profitCents={cashedOut.profit} totalCents={cashedOut.total} />
      )}
    </div>
  )
}
