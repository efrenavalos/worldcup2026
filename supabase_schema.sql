-- ============================================================
-- WORLD CUP POOL 2026 — Supabase Schema
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name      text,
  email     text,
  is_admin  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Auto-crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── MATCHES ────────────────────────────────────────────────
CREATE TABLE matches (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fixture_id   bigint UNIQUE NOT NULL,
  team_home    text NOT NULL,
  team_away    text NOT NULL,
  home_logo    text,
  away_logo    text,
  match_date   timestamptz NOT NULL,
  status       text DEFAULT 'NS',    -- NS, 1H, HT, 2H, FT, PST, CANC
  home_score   int,
  away_score   int,
  updated_at   timestamptz DEFAULT now()
);

-- ─── PREDICTIONS ────────────────────────────────────────────
CREATE TABLE predictions (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id       bigint NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  pred_home      int NOT NULL CHECK (pred_home >= 0),
  pred_away      int NOT NULL CHECK (pred_away >= 0),
  confirmed      boolean DEFAULT false,
  points_awarded int DEFAULT 0,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (user_id, match_id)
);

-- ─── STANDINGS ──────────────────────────────────────────────
CREATE TABLE standings (
  user_id       uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_points  int DEFAULT 0,
  exact_hits    int DEFAULT 0,
  winner_hits   int DEFAULT 0,
  updated_at    timestamptz DEFAULT now()
);

-- Auto-crear standing al crear perfil
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO standings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings   ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuario lee/edita solo su perfil; admin lee todos
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- matches: lectura pública para autenticados; escritura solo admin
CREATE POLICY "matches_select_auth" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_write_admin" ON matches FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- predictions: usuarios leen/insertan las suyas; NO pueden UPDATE si confirmed = true
CREATE POLICY "predictions_select_own" ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "predictions_insert_own" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CRÍTICO: bloquear UPDATE si ya fue confirmada (irreversible)
CREATE POLICY "predictions_update_unconfirmed" ON predictions FOR UPDATE
  USING (auth.uid() = user_id AND confirmed = false);

-- Admin puede leer todas las predicciones
CREATE POLICY "predictions_select_admin" ON predictions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Admin puede actualizar puntos (points_awarded)
CREATE POLICY "predictions_update_admin" ON predictions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- standings: lectura pública para autenticados; escritura solo admin
CREATE POLICY "standings_select_auth" ON standings FOR SELECT TO authenticated USING (true);
CREATE POLICY "standings_write_admin" ON standings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_predictions_user  ON predictions (user_id);
CREATE INDEX idx_predictions_match ON predictions (match_id);
CREATE INDEX idx_matches_date      ON matches (match_date);
CREATE INDEX idx_matches_status    ON matches (status);
