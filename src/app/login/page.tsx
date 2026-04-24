'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = isSignUp ? await signUpWithEmail(fd) : await signInWithEmail(fd)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-[#0d001a] px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-white text-2xl font-bold text-center">
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-lg transition-colors"
          >
            {loading ? '...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <button
          onClick={() => signInWithGoogle()}
          className="w-full py-4 rounded-xl border border-gray-600 text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <span className="font-bold">G</span> Continuar com Google
        </button>

        <button
          onClick={() => setIsSignUp((v) => !v)}
          className="text-gray-400 text-sm text-center hover:text-purple-300 transition-colors"
        >
          {isSignUp ? 'Já tenho conta — Entrar' : 'Não tenho conta — Criar'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="text-gray-600 text-sm text-center hover:text-gray-400 transition-colors"
        >
          Continuar sem conta
        </button>
      </div>
    </div>
  )
}
