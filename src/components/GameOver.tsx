interface GameOverProps {
  score: number
  bestScore: number
  onRestart: () => void
  onHome: () => void
}

export default function GameOver({ score, bestScore, onRestart, onHome }: GameOverProps) {
  const isNewRecord = score > 0 && score >= bestScore

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 px-8 py-10 rounded-2xl bg-[#1a0533]/90 border border-purple-800 w-80 max-w-[90vw]">
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
