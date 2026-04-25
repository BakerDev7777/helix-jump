'use client'

interface HUDProps {
  score: number
  combo: number
}

export default function HUD({ score, combo }: HUDProps) {
  return (
    <>
      {/* Large score, top center, below bet header */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[#1a1a2e] font-bold pointer-events-none select-none whitespace-nowrap z-10"
        style={{
          top: 'calc(150px + env(safe-area-inset-top, 0px))',
          fontSize: '64px',
          textShadow: '0 2px 8px rgba(255,255,255,0.6)',
        }}
      >
        {score}
      </div>

      {/* Combo */}
      {combo >= 2 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[#e91e63] font-bold text-xl pointer-events-none z-10"
          style={{ top: 'calc(226px + env(safe-area-inset-top, 0px))' }}
        >
          {Math.min(combo, 5)}x combo!
        </div>
      )}
    </>
  )
}
