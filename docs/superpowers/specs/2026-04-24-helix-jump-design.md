# Helix Jump — Design Spec
**Data:** 2026-04-24

## Visão Geral

Clone fiel do jogo Helix Jump para navegador com foco em mobile. Uma bola cai por uma torre helicoidal com plataformas coloridas que possuem buracos. O jogador rotaciona a torre para guiar a bola pelos buracos. Tocar uma parte colorida da plataforma resulta em game over.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Jogo 3D | Three.js |
| Auth + DB | Supabase |
| Deploy | Vercel |
| Linguagem | TypeScript |

---

## Arquitetura

```
helix-jump/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← tela inicial
│   │   ├── game/page.tsx         ← página do jogo
│   │   ├── ranking/page.tsx      ← leaderboard global
│   │   └── profile/page.tsx      ← perfil do usuário (futuro)
│   ├── components/
│   │   ├── GameCanvas.tsx        ← componente Three.js (use client)
│   │   ├── GameOver.tsx          ← overlay de game over
│   │   └── HUD.tsx               ← pontuação em tempo real
│   └── lib/
│       ├── game/                 ← lógica do jogo (pura, sem React)
│       │   ├── Ball.ts
│       │   ├── Helix.ts
│       │   ├── Physics.ts
│       │   └── GameLoop.ts
│       └── supabase.ts           ← cliente Supabase
├── supabase/
│   └── migrations/               ← DDL das tabelas
└── public/
```

**Princípio central:** a lógica do jogo (`lib/game/`) é TypeScript puro, sem dependência de React. O `GameCanvas.tsx` apenas monta o canvas, inicializa o loop e conecta eventos de toque. Isso isola o jogo da UI e facilita evolução futura.

---

## Mecânicas do Jogo

### Torre Helicoidal
- Gerada proceduralmente com `TorusGeometry` do Three.js
- Cada anel é dividido em segmentos; um segmento é removido para criar o buraco (gap)
- ~12 anéis visíveis simultaneamente; novos anéis gerados no fundo conforme a bola desce, anéis do topo descartados
- Dificuldade aumenta progressivamente: buracos menores, rotação mais rápida dos anéis

### Bola
- `SphereGeometry` branca
- Física simples: `velocityY += gravity * delta` a cada frame
- **Colisão com buraco:** bola passa, mantém velocidade
- **Colisão com parte colorida:** game over imediato
- Detecção de colisão por comparação de ângulo da bola vs. ângulo do gap no anel

### Sistema de Combo
- Passar por 2+ plataformas consecutivas sem tocar = combo ativo
- Visual: bola entra em modo "chamas" (partículas ou brilho laranja)
- Multiplicador: x2 no 2º, x3 no 3º, até x5
- Combo quebrado ao tocar plataforma (game over) ou ao parar de cair

### Controle
- **Mobile:** `touchmove` horizontal → rotaciona torre no eixo Y
- **Desktop:** `mousemove` com botão pressionado → mesma lógica
- Velocidade de rotação proporcional ao delta do toque

### Pontuação
- +1 ponto por plataforma passada
- Multiplicado pelo combo ativo
- Exibida no HUD em tempo real
- Recorde pessoal salvo em `localStorage` (guest) ou Supabase (logado)

### Câmera
- Posição fixa levemente acima e atrás da bola
- Segue a bola no eixo Y com interpolação (`lerp`) para movimento suave

### Progressão de Dificuldade
- A cada 10 plataformas passadas: gap diminui 5%, velocidade máxima de rotação aumenta 10%
- Teto de dificuldade atingido em ~100 plataformas

---

## Telas e Fluxo

```
Tela Inicial → [Jogar] → Jogo → [Game Over] → [Jogar Novamente] → Jogo
                                             → [Início] → Tela Inicial
            → [Ranking] → Ranking Global
            → [Entrar] → Login → Tela Inicial
```

### Tela Inicial
- Logo do jogo animado
- Melhor pontuação pessoal exibida
- Botões: Jogar, Ranking, Entrar / Avatar (se logado)

### Jogo
- Canvas Three.js fullscreen (sem UI ao redor)
- HUD sobreposto: pontuação no topo centro, combo indicator
- Pausa ao perder foco (visibilidade da aba)

### Game Over (overlay)
- Pontuação da partida
- Recorde pessoal (destacado se novo recorde)
- Botões: Jogar Novamente, Voltar ao Início
- Se logado: score salvo automaticamente no Supabase

### Ranking Global (`/ranking`)
- Top 100 scores por usuário (MAX score)
- Acessível sem login
- Posição do usuário logado destacada
- Atualização em tempo real via Supabase Realtime (opcional)

### Login (`/login`)
- Email + senha
- Google OAuth
- Link "Continuar sem conta"

---

## Banco de Dados (Supabase)

### Tabelas

```sql
-- Perfil estendido do usuário
CREATE TABLE profiles (
  id          uuid REFERENCES auth.users PRIMARY KEY,
  username    text UNIQUE NOT NULL,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
);

-- Pontuações individuais por partida
CREATE TABLE scores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score       int NOT NULL,
  combo_max   int NOT NULL DEFAULT 0,
  played_at   timestamptz DEFAULT now()
);
```

### Row Level Security
- `profiles`: usuário lê/edita apenas o próprio perfil
- `scores`: usuário insere apenas scores próprios; leitura pública para ranking
- Ranking query: `SELECT user_id, MAX(score) FROM scores GROUP BY user_id ORDER BY max DESC LIMIT 100`

---

## Autenticação

- Supabase Auth com providers: Email/Senha e Google OAuth
- Sessão persistida via cookie (Next.js middleware do Supabase)
- Guest: joga normalmente, score salvo só em `localStorage`
- Após login: score da partida atual pode ser enviado retroativamente

---

## Considerações Mobile

- Viewport configurado: `width=device-width, initial-scale=1, user-scalable=no`
- Canvas ocupa 100% da tela (`100dvh`)
- `touch-action: none` no canvas para evitar scroll acidental
- Performance alvo: 60fps em dispositivos mid-range (iPhone 11, Samsung A54)
- Three.js com `antialias: false` em pixel ratio > 2 para preservar performance

---

## Fora do Escopo (v1)

- Sons e música
- Skins/temas alternativos
- Modo multiplayer
- Conquistas/achievements
- Anúncios para continuar após game over
- PWA / instalação na home screen
