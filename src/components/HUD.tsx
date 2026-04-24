interface HUDProps {
  score: number
  combo: number
}

export default function HUD({ score, combo }: HUDProps) {
  return (
    <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-8 pointer-events-none select-none">
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
