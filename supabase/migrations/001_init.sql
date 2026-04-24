-- Perfil do usuário (estende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    text UNIQUE NOT NULL,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
);

-- Pontuações por partida
CREATE TABLE IF NOT EXISTS scores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score       int NOT NULL CHECK (score >= 0),
  combo_max   int NOT NULL DEFAULT 0 CHECK (combo_max >= 0),
  played_at   timestamptz DEFAULT now()
);

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: leitura própria" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: escrita própria" ON profiles
  FOR ALL USING (auth.uid() = id);

-- RLS: scores
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores: inserção própria" ON scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scores: leitura pública" ON scores
  FOR SELECT USING (true);

-- Trigger: criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
