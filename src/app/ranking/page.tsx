import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRanking } from '@/lib/supabase'

export const revalidate = 60

export default async function RankingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const ranking = await getRanking()

  const medal = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`

  return (
    <div className="flex flex-col h-dvh bg-[#0d001a]">
      <div className="flex items-center gap-4 px-4 pt-10 pb-4 border-b border-white/5">
        <Link href="/" className="text-gray-400 hover:text-white text-2xl leading-none">
          ←
        </Link>
        <h1 className="text-white text-xl font-bold">Ranking Global</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {ranking.length === 0 && (
          <p className="text-gray-500 text-center mt-16 text-sm">
            Nenhuma pontuação ainda. Seja o primeiro!
          </p>
        )}
        <div className="flex flex-col gap-2 max-w-md mx-auto">
          {ranking.map((entry) => {
            const isCurrentUser = entry.user_id === user?.id
            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                  isCurrentUser
                    ? 'bg-purple-900/60 border border-purple-500'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{medal(entry.rank)}</span>
                  <span className={`font-medium ${isCurrentUser ? 'text-purple-200' : 'text-white'}`}>
                    {entry.username}
                    {isCurrentUser && (
                      <span className="text-purple-400 text-xs ml-1">(você)</span>
                    )}
                  </span>
                </div>
                <span className="text-white font-bold tabular-nums">{entry.best_score}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
