'use client'

interface BetHeaderProps {
  betCents: number
  targetCents: number
  perPlatformCents: number
  platformsPassed: number
  multiplier: number
  onExit: () => void
  onCashout: () => void
}

const formatBRL = (cents: number) =>
  'R$ ' + (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

export default function BetHeader({
  betCents,
  targetCents,
  perPlatformCents,
  platformsPassed,
  multiplier,
  onExit,
  onCashout,
}: BetHeaderProps) {
  const earnedCents = platformsPassed * perPlatformCents
  const pct = targetCents > 0 ? Math.min(100, Math.max(0, (earnedCents / targetCents) * 100)) : 0
  const targetReached = earnedCents >= targetCents && targetCents > 0

  return (
    <div className="absolute top-3 inset-x-3 z-20 grid gap-2.5 pointer-events-auto"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Top row: Aposta | META | X */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-white/15 bg-[#070815]/60 backdrop-blur-md text-white/95 shadow-2xl">
        <div className="flex flex-col gap-[3px] min-w-0">
          <small className="opacity-70 font-extrabold tracking-widest uppercase text-[11px]">Aposta</small>
          <b className="text-base tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {formatBRL(betCents)}
          </b>
        </div>
        <div className="flex items-center gap-2.5 font-black flex-none">
          <div className="px-2.5 py-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-50 font-black tracking-widest uppercase text-[11px] whitespace-nowrap">
            Meta {multiplier}x
          </div>
          <button
            type="button"
            onClick={onExit}
            className="w-10 h-10 rounded-xl border border-white/15 bg-white/5 text-white/90 grid place-items-center text-lg font-black hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress row */}
      <div className="grid gap-2 p-3 rounded-2xl border border-white/12 bg-[#070815]/55 backdrop-blur-md text-white/90">
        <div className="flex items-center justify-between gap-3 font-black">
          <div>
            <span className="block opacity-75 font-extrabold text-xs tracking-widest uppercase">Progresso</span>
            <b className="text-sm">{formatBRL(earnedCents)}</b>
          </div>
          <div className="text-right">
            <span className="block opacity-75 font-extrabold text-xs tracking-widest uppercase">Meta</span>
            <b className="text-sm">{formatBRL(targetCents)}</b>
          </div>
        </div>

        <div className="opacity-75 font-extrabold text-xs">
          + {formatBRL(perPlatformCents)} por plataforma • {platformsPassed} plataforma{platformsPassed === 1 ? '' : 's'}
        </div>

        <div className="h-2.5 rounded-full border border-white/12 bg-black/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, rgba(34,197,94,0.95), rgba(32,227,255,0.85))',
              boxShadow: '0 10px 24px rgba(34,197,94,0.16)',
            }}
          />
        </div>

        {targetReached && (
          <button
            type="button"
            onClick={onCashout}
            className="mt-1.5 h-11 rounded-xl border border-green-500/35 text-[#070815]/95 font-black text-[13px] tracking-widest uppercase flex items-center justify-center gap-2.5 w-full transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(32,227,255,0.75))',
            }}
          >
            Encerrar aposta
          </button>
        )}
      </div>
    </div>
  )
}
