# Helix Jump

Clone do jogo Helix Jump para navegador, com foco em mobile. Construído com Next.js 14, Three.js, e Supabase.

## Stack

- **Next.js 14** (App Router)
- **Three.js** — renderização 3D da torre
- **Supabase** — autenticação e ranking global
- **Tailwind CSS** — estilização
- **Vercel** — deploy

## Como jogar

- Arraste horizontalmente para girar a torre
- Guie a bola pelo buraco de cada plataforma
- Não toque nas partes coloridas — game over!
- Combo: passe por várias plataformas seguidas para multiplicar sua pontuação

## Setup local

1. Clone o repositório
2. `npm install`
3. Crie `.env.local` com suas chaves Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. Execute a migration SQL em `supabase/migrations/001_init.sql` no dashboard Supabase
5. `npm run dev`

## Deploy no Vercel

1. Importe o repositório no dashboard Vercel
2. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (sua URL de produção)
3. Deploy automático via push

## Supabase: Google OAuth

Em Authentication → Providers → Google:
- Ative Google OAuth
- Authorized redirect URI: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
