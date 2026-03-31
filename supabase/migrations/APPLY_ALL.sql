-- ═══════════════════════════════════════════════════════════════════════════
-- FUSSY — Full database setup (paste entire file into Supabase SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 001: PROFILES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        TEXT NOT NULL,
  avatar_url          TEXT,
  attributes          JSONB NOT NULL DEFAULT '{}',
  filters             JSONB NOT NULL DEFAULT '{}',
  soft_prefs          JSONB NOT NULL DEFAULT '{}',
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_attributes ON public.profiles USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_profiles_filters    ON public.profiles USING GIN (filters);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"           ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"           ON public.profiles;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());


-- ─── 002: MATCHES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.matches (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_2                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at              TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
  is_extended             BOOLEAN NOT NULL DEFAULT FALSE,
  extension_requested_by  UUID REFERENCES public.profiles(id),
  extension_reason        TEXT,
  extension_approved      BOOLEAN,
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'expired', 'date_set')),
  date_set_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_match    CHECK (user_1 != user_2),
  CONSTRAINT ordered_users    CHECK (user_1 < user_2),
  CONSTRAINT unique_active_pair UNIQUE (user_1, user_2)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_1     ON public.matches (user_1);
CREATE INDEX IF NOT EXISTS idx_matches_user_2     ON public.matches (user_2);
CREATE INDEX IF NOT EXISTS idx_matches_expires_at ON public.matches (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_matches_status     ON public.matches (status);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select_participant" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_participant" ON public.matches;
DROP POLICY IF EXISTS "matches_update_participant" ON public.matches;

CREATE POLICY "matches_select_participant"
  ON public.matches FOR SELECT TO authenticated
  USING (user_1 = auth.uid() OR user_2 = auth.uid());

CREATE POLICY "matches_insert_participant"
  ON public.matches FOR INSERT TO authenticated
  WITH CHECK (user_1 = auth.uid() OR user_2 = auth.uid());

CREATE POLICY "matches_update_participant"
  ON public.matches FOR UPDATE TO authenticated
  USING (user_1 = auth.uid() OR user_2 = auth.uid());


-- ─── 003: RPC FUNCTIONS ──────────────────────────────────────────────────────

-- Helper: checks if profile attributes satisfy a filter set
CREATE OR REPLACE FUNCTION public.fussy_filter_match(
  p_filters JSONB,
  p_attrs   JSONB
)
RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  -- Age min
  IF (p_filters->>'age_min') IS NOT NULL
     AND (p_attrs->>'age') IS NOT NULL
     AND (p_attrs->>'age')::INT < (p_filters->>'age_min')::INT
  THEN RETURN FALSE; END IF;

  -- Age max
  IF (p_filters->>'age_max') IS NOT NULL
     AND (p_attrs->>'age') IS NOT NULL
     AND (p_attrs->>'age')::INT > (p_filters->>'age_max')::INT
  THEN RETURN FALSE; END IF;

  -- Gender (filter is a JSONB array)
  IF (p_filters->'seeking_gender') IS NOT NULL
     AND jsonb_array_length(p_filters->'seeking_gender') > 0
     AND (p_attrs->>'gender') IS NOT NULL
     AND NOT (p_filters->'seeking_gender' @> to_jsonb(p_attrs->>'gender'))
  THEN RETURN FALSE; END IF;

  -- Has kids
  IF (p_filters->>'has_kids') IS NOT NULL
     AND (p_attrs->>'has_kids') IS NOT NULL
     AND (p_filters->>'has_kids')::BOOLEAN != (p_attrs->>'has_kids')::BOOLEAN
  THEN RETURN FALSE; END IF;

  -- Wants kids
  IF (p_filters->>'wants_kids') IS NOT NULL
     AND (p_attrs->>'wants_kids') IS NOT NULL
     AND (p_filters->>'wants_kids')::BOOLEAN != (p_attrs->>'wants_kids')::BOOLEAN
  THEN RETURN FALSE; END IF;

  -- Smoking (filter is a JSONB array of acceptable values)
  IF (p_filters->'smoking') IS NOT NULL
     AND jsonb_array_length(p_filters->'smoking') > 0
     AND (p_attrs->>'smoking') IS NOT NULL
     AND NOT (p_filters->'smoking' @> to_jsonb(p_attrs->>'smoking'))
  THEN RETURN FALSE; END IF;

  -- Drinking
  IF (p_filters->'drinking') IS NOT NULL
     AND jsonb_array_length(p_filters->'drinking') > 0
     AND (p_attrs->>'drinking') IS NOT NULL
     AND NOT (p_filters->'drinking' @> to_jsonb(p_attrs->>'drinking'))
  THEN RETURN FALSE; END IF;

  RETURN TRUE;
END;
$$;


-- Core RPC: reciprocal candidate matching
CREATE OR REPLACE FUNCTION public.get_fussy_candidates(
  requesting_user_id UUID
)
RETURNS TABLE (
  id           UUID,
  display_name TEXT,
  avatar_url   TEXT,
  attributes   JSONB,
  soft_prefs   JSONB
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_attrs   JSONB;
  v_my_filters JSONB;
BEGIN
  SELECT p.attributes, p.filters
    INTO v_my_attrs, v_my_filters
    FROM public.profiles p
   WHERE p.id = requesting_user_id;

  IF v_my_attrs IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT p.id, p.display_name, p.avatar_url, p.attributes, p.soft_prefs
    FROM public.profiles p
   WHERE p.id != requesting_user_id
     AND p.onboarding_complete = TRUE
     AND public.fussy_filter_match(v_my_filters, p.attributes)
     AND public.fussy_filter_match(p.filters, v_my_attrs)
     AND NOT EXISTS (
       SELECT 1 FROM public.matches m
        WHERE (
          (m.user_1 = requesting_user_id AND m.user_2 = p.id)
          OR
          (m.user_1 = p.id AND m.user_2 = requesting_user_id)
        )
        AND m.status IN ('active', 'date_set')
     )
   ORDER BY p.created_at DESC
   LIMIT 50;
END;
$$;


-- Extension approval (mutual consent, one-time only)
CREATE OR REPLACE FUNCTION public.approve_match_extension(
  p_match_id UUID,
  p_user_id  UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match public.matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

  IF v_match.id IS NULL            THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF v_match.status != 'active'    THEN RAISE EXCEPTION 'Match is not active'; END IF;
  IF v_match.is_extended           THEN RAISE EXCEPTION 'Extension already used'; END IF;
  IF v_match.extension_requested_by IS NULL THEN RAISE EXCEPTION 'No extension requested'; END IF;
  IF v_match.extension_requested_by = p_user_id THEN RAISE EXCEPTION 'Cannot approve own request'; END IF;
  IF p_user_id NOT IN (v_match.user_1, v_match.user_2) THEN RAISE EXCEPTION 'Not a participant'; END IF;

  UPDATE public.matches
     SET expires_at         = expires_at + INTERVAL '48 hours',
         is_extended        = TRUE,
         extension_approved = TRUE
   WHERE id = p_match_id;
END;
$$;


-- ─── Enable Realtime on matches table ────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;


-- ─── pg_cron: hourly Reaper (requires pg_cron extension to be enabled) ───────
-- Run this AFTER enabling pg_cron in Extensions → pg_cron in your dashboard:
--
-- SELECT cron.schedule(
--   'fussy-reaper',
--   '0 * * * *',
--   $$ SELECT net.http_post(
--        url    := current_setting('app.supabase_url') || '/functions/v1/reaper',
--        headers := json_build_object(
--          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--        )::jsonb
--      ) $$
-- );
