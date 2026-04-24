import { createBrowserClient } from '@supabase/ssr'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number
  combo_max: number
  played_at: string
}

export interface RankingEntry {
  user_id: string
  username: string
  best_score: number
  rank: number
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function saveScore(score: number, comboMax: number): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('scores').insert({ user_id: user.id, score, combo_max: comboMax })
}

export async function getRanking(): Promise<RankingEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('scores')
    .select('user_id, score, profiles(username)')
    .order('score', { ascending: false })

  if (!data) return []

  const map = new Map<string, RankingEntry>()
  for (const row of data) {
    const profile = row.profiles as unknown as { username: string }
    if (!map.has(row.user_id) || map.get(row.user_id)!.best_score < row.score) {
      map.set(row.user_id, {
        user_id: row.user_id,
        username: profile?.username ?? 'Anônimo',
        best_score: row.score,
        rank: 0,
      })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.best_score - a.best_score)
    .slice(0, 100)
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}

export function getBestScoreLocal(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem('helix_best_score') ?? '0', 10)
}

export function saveBestScoreLocal(score: number): void {
  const current = getBestScoreLocal()
  if (score > current) localStorage.setItem('helix_best_score', String(score))
}
