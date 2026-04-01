-- ============================================================
-- Migration 004 — Add p_less_fussy parameter to get_fussy_candidates
-- ============================================================
-- Apply this in Supabase Dashboard → SQL Editor
--
-- When p_less_fussy = FALSE (default):  BOTH sides must match (original behaviour)
-- When p_less_fussy = TRUE:             Only the requesting user's filters are checked.
--   i.e. "show me people I like, even if they might not have picked me"
-- ============================================================

CREATE OR REPLACE FUNCTION get_fussy_candidates(
  requesting_user_id uuid,
  p_less_fussy       boolean DEFAULT false
)
RETURNS TABLE (
  id           uuid,
  display_name text,
  avatar_url   text,
  attributes   jsonb,
  soft_prefs   jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req_profile profiles%ROWTYPE;
BEGIN
  -- Fetch the requesting user's profile
  SELECT * INTO req_profile FROM profiles WHERE profiles.id = requesting_user_id;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.attributes,
    p.soft_prefs
  FROM profiles p
  WHERE
    -- Don't show the requester themselves
    p.id <> requesting_user_id

    -- The other person must be onboarded
    AND p.onboarding_complete = true

    -- No existing match between the two users
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE (
        (m.user_1 = LEAST(requesting_user_id, p.id) AND m.user_2 = GREATEST(requesting_user_id, p.id))
      )
      AND m.status IN ('active', 'date_set')
    )

    -- The other user meets the requester's hard filters
    AND fussy_filter_match(p.attributes, req_profile.filters)

    -- Reciprocal check: requester meets other user's filters
    -- (skipped in less-fussy mode)
    AND (
      p_less_fussy = true
      OR fussy_filter_match(req_profile.attributes, p.filters)
    )

  ORDER BY RANDOM()
  LIMIT 50;
END;
$$;
