-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: RPC functions — reciprocal matching + extension approval
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Helper: check if a profile's attributes satisfy a filter set ─────────────
CREATE OR REPLACE FUNCTION public.fussy_filter_match(
  p_filters JSONB,
  p_attrs   JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Age: min
  IF (p_filters->>'age_min') IS NOT NULL
     AND (p_attrs->>'age') IS NOT NULL
     AND (p_attrs->>'age')::INT < (p_filters->>'age_min')::INT
  THEN RETURN FALSE; END IF;

  -- Age: max
  IF (p_filters->>'age_max') IS NOT NULL
     AND (p_attrs->>'age') IS NOT NULL
     AND (p_attrs->>'age')::INT > (p_filters->>'age_max')::INT
  THEN RETURN FALSE; END IF;

  -- Gender — filter is a JSONB array of acceptable genders
  IF (p_filters->'seeking_gender') IS NOT NULL
     AND jsonb_array_length(p_filters->'seeking_gender') > 0
     AND (p_attrs->>'gender') IS NOT NULL
     AND NOT (p_filters->'seeking_gender' @> to_jsonb(p_attrs->>'gender'))
  THEN RETURN FALSE; END IF;

  -- Has kids (optional filter)
  IF (p_filters->>'has_kids') IS NOT NULL
     AND (p_attrs->>'has_kids') IS NOT NULL
     AND (p_filters->>'has_kids')::BOOLEAN != (p_attrs->>'has_kids')::BOOLEAN
  THEN RETURN FALSE; END IF;

  -- Wants kids (optional filter)
  IF (p_filters->>'wants_kids') IS NOT NULL
     AND (p_attrs->>'wants_kids') IS NOT NULL
     AND (p_filters->>'wants_kids')::BOOLEAN != (p_attrs->>'wants_kids')::BOOLEAN
  THEN RETURN FALSE; END IF;

  -- Smoking — filter is a JSONB array of acceptable values
  IF (p_filters->'smoking') IS NOT NULL
     AND jsonb_array_length(p_filters->'smoking') > 0
     AND (p_attrs->>'smoking') IS NOT NULL
     AND NOT (p_filters->'smoking' @> to_jsonb(p_attrs->>'smoking'))
  THEN RETURN FALSE; END IF;

  -- Drinking — filter is a JSONB array of acceptable values
  IF (p_filters->'drinking') IS NOT NULL
     AND jsonb_array_length(p_filters->'drinking') > 0
     AND (p_attrs->>'drinking') IS NOT NULL
     AND NOT (p_filters->'drinking' @> to_jsonb(p_attrs->>'drinking'))
  THEN RETURN FALSE; END IF;

  RETURN TRUE;
END;
$$;


-- ─── Core RPC: get_fussy_candidates ──────────────────────────────────────────
-- Returns profiles where:
--   1. MY filters match THEIR attributes
--   2. THEIR filters match MY attributes  (reciprocal)
--   3. No active match already exists between us
--   4. They have completed onboarding

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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_attrs    JSONB;
  v_my_filters  JSONB;
BEGIN
  -- Load the requesting user's own data
  SELECT p.attributes, p.filters
    INTO v_my_attrs, v_my_filters
    FROM public.profiles p
   WHERE p.id = requesting_user_id;

  IF v_my_attrs IS NULL THEN
    RETURN; -- Profile not found / onboarding incomplete
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.attributes,
    p.soft_prefs
  FROM public.profiles p
  WHERE
    -- Exclude self
    p.id != requesting_user_id

    -- Only onboarded profiles
    AND p.onboarding_complete = TRUE

    -- My filters must match their attributes
    AND public.fussy_filter_match(v_my_filters, p.attributes)

    -- Their filters must match my attributes (reciprocal)
    AND public.fussy_filter_match(p.filters, v_my_attrs)

    -- No active/pending match already exists
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


-- ─── Extension approval (mutual consent) ─────────────────────────────────────
-- Called by the OTHER party to approve an extension request.
-- Adds 48h to expires_at and marks is_extended = true (one-time only).

CREATE OR REPLACE FUNCTION public.approve_match_extension(
  p_match_id UUID,
  p_user_id  UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

  -- Validate
  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  IF v_match.status != 'active' THEN
    RAISE EXCEPTION 'Match is not active';
  END IF;
  IF v_match.is_extended THEN
    RAISE EXCEPTION 'Extension already used';
  END IF;
  IF v_match.extension_requested_by IS NULL THEN
    RAISE EXCEPTION 'No extension has been requested';
  END IF;
  -- The approver must be the OTHER party, not the requester
  IF v_match.extension_requested_by = p_user_id THEN
    RAISE EXCEPTION 'Cannot approve your own extension request';
  END IF;
  -- Approver must be a participant
  IF p_user_id NOT IN (v_match.user_1, v_match.user_2) THEN
    RAISE EXCEPTION 'Not a participant of this match';
  END IF;

  UPDATE public.matches
     SET expires_at         = expires_at + INTERVAL '48 hours',
         is_extended        = TRUE,
         extension_approved = TRUE
   WHERE id = p_match_id;
END;
$$;
