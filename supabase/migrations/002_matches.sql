-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Matches table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.matches (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- user_1 is always the smaller UUID (enforced by constraint) to prevent duplicates
  user_1                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_2                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Match expires 72 hours after creation
  expires_at              TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
  -- Extension fields — one-time use, mutual consent required
  is_extended             BOOLEAN NOT NULL DEFAULT FALSE,
  extension_requested_by  UUID REFERENCES public.profiles(id),
  extension_reason        TEXT,
  extension_approved      BOOLEAN,
  -- Status lifecycle: active → expired | date_set
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'expired', 'date_set')),
  date_set_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent self-matches and ensure canonical ordering
  CONSTRAINT no_self_match    CHECK (user_1 != user_2),
  CONSTRAINT ordered_users    CHECK (user_1 < user_2),
  -- No duplicate active matches between the same two people
  CONSTRAINT unique_active_pair UNIQUE (user_1, user_2)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_1      ON public.matches (user_1);
CREATE INDEX IF NOT EXISTS idx_matches_user_2      ON public.matches (user_2);
CREATE INDEX IF NOT EXISTS idx_matches_expires_at  ON public.matches (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_matches_status      ON public.matches (status);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Users can only see matches they are part of
CREATE POLICY "matches_select_participant"
  ON public.matches FOR SELECT
  TO authenticated
  USING (user_1 = auth.uid() OR user_2 = auth.uid());

-- Users can create matches (the app enforces the ordered UUID logic)
CREATE POLICY "matches_insert_participant"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (user_1 = auth.uid() OR user_2 = auth.uid());

-- Users can update matches they're part of (for extensions, date booking, etc.)
CREATE POLICY "matches_update_participant"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (user_1 = auth.uid() OR user_2 = auth.uid());
