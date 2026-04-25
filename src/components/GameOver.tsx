'use client'

interface GameOverProps {
  score: number
  bestScore: number
  onRestart: () => void
  onHome: () => void
}

export default function GameOver({ score, bestScore, onRestart, onHome }: GameOverProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-white/92 px-6 py-7 rounded-[22px] shadow-2xl backdrop-blur-md w-[min(360px,calc(100vw-40px))] z-40">
      <h2 className="mb-2.5 text-[#1a1a2e] text-[32px]">☹</h2>
      <p className="mb-2 text-[#555] text-lg">
        <b>Não foi dessa vez.</b>
      </p>
      <p className="mb-2 text-[#555] text-lg">Escolha um novo valor e tente novamente.</p>
      <p className="mb-2 text-[#555] text-lg">
        Score: <span className="font-bold">{score}</span> • Recorde:{' '}
        <span className="font-bold">{Math.max(score, bestScore)}</span>
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-4 w-full px-4 py-3.5 text-base font-bold text-white bg-[#e91e63] hover:bg-[#c2185b] active:bg-[#c2185b] border-none rounded-[10px] cursor-pointer transition-colors"
      >
        Jogar Novamente
      </button>
      <button
        type="button"
        onClick={onHome}
        className="mt-2.5 w-full px-4 py-3 text-sm font-medium text-[#555] hover:bg-[#f5f5f5] border border-[#ddd] rounded-[10px] cursor-pointer transition-colors"
      >
        Voltar ao painel
      </button>
    </div>
  )
}
