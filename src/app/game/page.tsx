'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import HUD from '@/components/HUD'
import GameOver from '@/components/GameOver'
import { saveScore, saveBestScoreLocal, getBestScoreLocal } from '@/lib/supabase'

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
    <div
      className="relative w-full h-dvh overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/stadium.jpg')", backgroundColor: '#0d4a2a' }}
    >
      <GameCanvas
        gameKey={gameKey}
        onScoreChange={handleScoreChange}
        onGameOver={handleGameOver}
      />
      <HUD score={score} combo={combo} />
      {score === 0 && !isGameOver && (
        <div className="absolute bottom-24 inset-x-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-white/80 text-lg font-semibold tracking-widest drop-shadow-lg">
            ← Arraste →
          </span>
        </div>
      )}
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
