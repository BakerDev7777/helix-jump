import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-[#0d001a] gap-8 px-6">
      <div className="flex flex-col items-center gap-2">
        <div className="text-6xl font-black tracking-tight text-white">
          <span className="text-purple-400">H</span>ELIX
        </div>
        <div className="text-3xl font-black tracking-tight text-white">
          <span className="text-pink-500">J</span>UMP
        </div>
        <p className="mt-1 text-gray-500 text-sm text-center">
          Gire a torre. Não toque as plataformas.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/game"
          className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xl font-bold text-center transition-colors shadow-lg shadow-purple-900/50"
        >
          ▶ Jogar
        </Link>
        <Link
          href="/ranking"
          className="w-full py-4 rounded-2xl border border-purple-700 text-purple-300 text-base font-medium text-center hover:bg-purple-900/30 transition-colors"
        >
          🏆 Ranking
        </Link>
        {user ? (
          <p className="text-center text-gray-400 text-sm pt-1">
            Logado como <span className="text-purple-300">{user.email}</span>
          </p>
        ) : (
          <Link
            href="/login"
            className="w-full py-4 rounded-2xl border border-gray-700 text-gray-400 text-base font-medium text-center hover:bg-gray-900/40 transition-colors"
          >
            👤 Entrar
          </Link>
        )}
      </div>
    </div>
  )
}
