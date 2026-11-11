-- ============================================================
-- LEARNHUB — HUB SCHEMA
--
-- Builds the whole app inside the `learnhub` schema of the shared Supabase
-- project (demobismark). Same tables as supabase/schema.sql, with:
--   - users.id tied to the shared auth.users (one email = one account across
--     the hub's apps) and a sign-up trigger for users tagged
--     user_metadata.app = 'learnhub';
--   - RLS on every table. Signed-in users can read the catalogue and their
--     own rows, and write only their own progress, notes and bookmarks.
--     Plans, roles, courses and audit logs change only through the app's
--     server routes (service role);
--   - the demo-admin guard used across the hub (app_metadata.no_delete).
--
-- Re-runnable: the schema is dropped and rebuilt, so ALL learnhub data is
-- wiped (auth.users is shared and untouched). Re-run the seed afterwards:
--   node scripts/seed-hub.mjs
--
-- Requires `learnhub` in the project's exposed API schemas
-- (Project Settings → Data API → Exposed schemas).
-- ============================================================

BEGIN;

DROP SCHEMA IF EXISTS learnhub CASCADE;
CREATE SCHEMA learnhub;

-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────
CREATE TABLE learnhub.users (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              TEXT UNIQUE NOT NULL,
  full_name          TEXT,
  avatar_url         TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learnhub.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL UNIQUE REFERENCES learnhub.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id        TEXT NOT NULL,
  tier                   TEXT NOT NULL CHECK (tier IN ('insider', 'core', 'pro')),
  status                 TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learnhub.courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  required_tier TEXT NOT NULL CHECK (required_tier IN ('insider', 'core', 'pro')),
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learnhub.modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES learnhub.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, slug)
);

-- video_url holds a path in the private storage bucket (signed per request
-- after the tier check) or a full https URL.
CREATE TABLE learnhub.lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id   UUID NOT NULL REFERENCES learnhub.modules(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  content     TEXT,
  video_url   TEXT,
  duration    INTEGER,
  is_preview  BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, slug)
);

CREATE TABLE learnhub.user_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES learnhub.users(id) ON DELETE CASCADE,
  lesson_id     UUID NOT NULL REFERENCES learnhub.lessons(id) ON DELETE CASCADE,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  last_position INTEGER NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE learnhub.notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES learnhub.users(id) ON DELETE CASCADE,
  lesson_id  UUID NOT NULL REFERENCES learnhub.lessons(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  timestamp  INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learnhub.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES learnhub.users(id) ON DELETE CASCADE,
  lesson_id  UUID NOT NULL REFERENCES learnhub.lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

-- file_path is a path in the private storage bucket.
CREATE TABLE learnhub.media_library (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL CHECK (type IN ('pdf', 'epub', 'audio')),
  file_path     TEXT NOT NULL,
  required_tier TEXT NOT NULL CHECK (required_tier IN ('insider', 'core', 'pro')),
  duration      INTEGER,
  pages         INTEGER,
  cover_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learnhub.roles (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learnhub.user_roles (
  user_id    UUID NOT NULL REFERENCES learnhub.users(id) ON DELETE CASCADE,
  role_id    BIGINT NOT NULL REFERENCES learnhub.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES learnhub.users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE learnhub.admin_audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES learnhub.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learnhub_modules_course   ON learnhub.modules(course_id, order_index);
CREATE INDEX idx_learnhub_lessons_module   ON learnhub.lessons(module_id, order_index);
CREATE INDEX idx_learnhub_progress_user    ON learnhub.user_progress(user_id, updated_at DESC);
CREATE INDEX idx_learnhub_notes_user       ON learnhub.notes(user_id, lesson_id, created_at DESC);
CREATE INDEX idx_learnhub_audit_created    ON learnhub.admin_audit_logs(created_at DESC);
CREATE INDEX idx_learnhub_user_roles_role  ON learnhub.user_roles(role_id);

INSERT INTO learnhub.roles (name) VALUES ('admin'), ('instructor'), ('member');

-- ────────────────────────────────────────────────────────────
-- HELPERS
-- ────────────────────────────────────────────────────────────
CREATE FUNCTION learnhub.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM learnhub.user_roles ur
    JOIN learnhub.roles r ON r.id = ur.role_id
    WHERE ur.user_id = uid AND r.name = 'admin'
  );
$$;

CREATE FUNCTION learnhub.tier_level(t TEXT)
RETURNS INTEGER
LANGUAGE SQL IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE t WHEN 'insider' THEN 1 WHEN 'core' THEN 2 WHEN 'pro' THEN 3 ELSE 0 END;
$$;

-- The highest tier a user currently holds (0 = no active plan).
CREATE FUNCTION learnhub.user_tier_level(uid UUID)
RETURNS INTEGER
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(max(learnhub.tier_level(s.tier)), 0)
  FROM learnhub.subscriptions s
  WHERE s.user_id = uid AND s.status IN ('active', 'trialing');
$$;

-- One row per user with plan and admin flag: the admin console's user list.
-- security_invoker: RLS on the underlying tables still applies to end users.
CREATE VIEW learnhub.user_directory WITH (security_invoker = true) AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.created_at,
  s.tier,
  s.status,
  s.current_period_end,
  learnhub.is_admin(u.id) AS is_admin
FROM learnhub.users u
LEFT JOIN learnhub.subscriptions s ON s.user_id = u.id;

-- ────────────────────────────────────────────────────────────
-- SIGN-UP TRIGGER (only for users tagged user_metadata.app = 'learnhub')
-- ────────────────────────────────────────────────────────────
CREATE FUNCTION learnhub.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO learnhub.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO learnhub.user_roles (user_id, role_id)
  SELECT NEW.id, r.id FROM learnhub.roles r WHERE r.name = 'member'
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation because of this app's profile.
  RAISE WARNING 'learnhub.handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_learnhub ON auth.users;
CREATE TRIGGER on_auth_user_created_learnhub
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'app' = 'learnhub')
  EXECUTE FUNCTION learnhub.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE learnhub.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.modules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.lessons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.user_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.notes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.bookmarks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.media_library    ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnhub.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles and plans: your own, or everyone's if you are an admin. No writes
-- from the browser: plans change through Stripe webhooks or admin routes.
CREATE POLICY "users read self or admin" ON learnhub.users
  FOR SELECT TO authenticated USING (auth.uid() = id OR learnhub.is_admin(auth.uid()));

CREATE POLICY "subscriptions read self or admin" ON learnhub.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR learnhub.is_admin(auth.uid()));

-- Catalogue: published courses and their modules are public; admins see drafts.
CREATE POLICY "courses read published" ON learnhub.courses
  FOR SELECT TO anon, authenticated USING (is_published OR learnhub.is_admin(auth.uid()));

CREATE POLICY "modules read published" ON learnhub.modules
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM learnhub.courses c
    WHERE c.id = course_id AND (c.is_published OR learnhub.is_admin(auth.uid()))
  ));

-- Lessons: preview lessons for any signed-in user; the rest need the course's tier.
CREATE POLICY "lessons read by tier" ON learnhub.lessons
  FOR SELECT TO authenticated USING (
    learnhub.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM learnhub.modules m
      JOIN learnhub.courses c ON c.id = m.course_id
      WHERE m.id = module_id
        AND c.is_published
        AND (is_preview OR learnhub.user_tier_level(auth.uid()) >= learnhub.tier_level(c.required_tier))
    )
  );

-- A learner's own activity.
CREATE POLICY "progress own" ON learnhub.user_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes own" ON learnhub.notes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks own" ON learnhub.bookmarks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Media metadata is visible to signed-in users; the files stay in a private
-- bucket and are only reachable through signed URLs after the tier check.
CREATE POLICY "media read signed in" ON learnhub.media_library
  FOR SELECT TO authenticated USING (true);

-- RBAC: read your own roles (the admin check in the app's middleware),
-- admins read all. Role changes go through the admin routes only.
CREATE POLICY "roles read" ON learnhub.roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_roles read own or admin" ON learnhub.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR learnhub.is_admin(auth.uid()));

CREATE POLICY "audit read admin" ON learnhub.admin_audit_logs
  FOR SELECT TO authenticated USING (learnhub.is_admin(auth.uid()));

-- ────────────────────────────────────────────────────────────
-- GRANTS (RLS stays on; these only open the schema to the API roles)
-- ────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA learnhub TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA learnhub TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA learnhub TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA learnhub TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA learnhub
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA learnhub
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA learnhub
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA learnhub TO supabase_auth_admin;
    GRANT EXECUTE ON FUNCTION learnhub.handle_new_user() TO supabase_auth_admin;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- DEMO ADMIN THAT CANNOT DELETE (app_metadata.no_delete, as on the other hub apps)
-- The app's server routes also refuse role removal and changes to protected
-- demo accounts for these sessions.
-- ────────────────────────────────────────────────────────────

-- 1. Restrictive DELETE policy on every table (direct API deletes).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'learnhub' LOOP
    EXECUTE format('DROP POLICY IF EXISTS learnhub_no_delete_demo_admin ON learnhub.%I', t);
    EXECUTE format(
      'CREATE POLICY learnhub_no_delete_demo_admin ON learnhub.%I AS RESTRICTIVE FOR DELETE TO authenticated '
      'USING (coalesce((auth.jwt()->''app_metadata''->>''no_delete'')::boolean, false) = false)', t);
  END LOOP;
END $$;

-- 2. Statement-level guard: turns a silent 0-row delete into an explicit 403.
CREATE FUNCTION learnhub.is_no_delete_session()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SET search_path = ''
AS $$
  SELECT coalesce((auth.jwt()->'app_metadata'->>'no_delete')::boolean, false)
$$;

CREATE FUNCTION learnhub.block_no_delete_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF learnhub.is_no_delete_session() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Demo admin accounts can''t delete data';
  END IF;
  RETURN NULL;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'learnhub' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS learnhub_no_delete_demo_admin ON learnhub.%I', t);
    EXECUTE format(
      'CREATE TRIGGER learnhub_no_delete_demo_admin BEFORE DELETE ON learnhub.%I '
      'FOR EACH STATEMENT EXECUTE FUNCTION learnhub.block_no_delete_session()', t);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION learnhub.is_no_delete_session() TO anon, authenticated, service_role;

COMMIT;
