'use client'

interface StartScreenProps {
  onStart: () => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div
      onClick={onStart}
      onTouchStart={onStart}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#fff0f0]/90 cursor-pointer select-none"
    >
      <p className="text-[26px] font-bold text-[#1a1a2e] mb-5">Toque para jogar</p>
      <span
        className="text-[52px] text-[#1a1a2e]"
        style={{ animation: 'bounce-arrow 1s ease-in-out infinite' }}
      >
        ↓
      </span>
      <style>{`
        @keyframes bounce-arrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(14px); }
        }
      `}</style>
    </div>
  )
}
