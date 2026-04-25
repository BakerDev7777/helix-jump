'use client'

interface CashoutModalProps {
  profitCents: number
  totalCents: number
}

const formatBRL = (cents: number) =>
  'R$ ' + (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

export default function CashoutModal({ profitCents, totalCents }: CashoutModalProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-white/92 px-6 py-7 rounded-[22px] shadow-2xl backdrop-blur-md w-[min(360px,calc(100vw-40px))] z-40">
      <h2 className="mb-2.5 text-[#1a1a2e] text-[32px]">✓</h2>
      <p className="mb-2 text-[#555] text-lg">
        <b>Aposta encerrada!</b>
      </p>
      <p className="mb-2 text-[#555] text-lg">
        Lucro: <span className="font-bold">{formatBRL(profitCents)}</span>
      </p>
      <p className="mb-2 text-[#555] text-lg">
        Total creditado: <span className="font-bold">{formatBRL(totalCents)}</span>
      </p>
      <div className="mt-2.5 text-[13px] text-[#555]/85">Voltando automaticamente…</div>
    </div>
  )
}
