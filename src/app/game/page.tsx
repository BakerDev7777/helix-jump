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
