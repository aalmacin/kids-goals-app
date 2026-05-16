CREATE OR REPLACE FUNCTION end_day(p_day_record_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kid_id   uuid;
  v_family_id uuid;
  v_is_rest_day boolean;
  v_ended_at timestamptz;
  v_total_penalty integer;
  v_rec record;
BEGIN
  -- Verify caller owns this day record
  SELECT dr.kid_id, dr.ended_at, dr.is_rest_day, k.family_id
    INTO v_kid_id, v_ended_at, v_is_rest_day, v_family_id
    FROM day_records dr
    JOIN kids k ON k.id = dr.kid_id
   WHERE dr.id = p_day_record_id
     AND k.supabase_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Day record not found or not authorized';
  END IF;

  -- Idempotent: already ended
  IF v_ended_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  -- Calculate and apply penalty
  SELECT COALESCE(SUM(penalty_snapshot), 0)
    INTO v_total_penalty
    FROM chore_completions
   WHERE day_record_id = p_day_record_id
     AND completed_at IS NULL
     AND (NOT v_is_rest_day OR is_important_snapshot = true);

  IF v_total_penalty > 0 THEN
    INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
    VALUES (v_family_id, v_kid_id, 'kid', 'penalty_applied',
            jsonb_build_object('day_record_id', p_day_record_id, 'total_penalty', v_total_penalty),
            -v_total_penalty);
  END IF;

  -- Grant chore completion rewards
  FOR v_rec IN
    SELECT id, chore_name_snapshot, reward_snapshot
      FROM chore_completions
     WHERE day_record_id = p_day_record_id
       AND completed_at IS NOT NULL
       AND reward_snapshot > 0
  LOOP
    INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
    VALUES (v_family_id, v_kid_id, 'kid', 'chore_completion_reward',
            jsonb_build_object('chore_name', v_rec.chore_name_snapshot, 'completion_id', v_rec.id),
            v_rec.reward_snapshot);
  END LOOP;

  -- Mark day as ended
  UPDATE day_records SET ended_at = now() WHERE id = p_day_record_id;

  INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
  VALUES (v_family_id, v_kid_id, 'kid', 'day_ended',
          jsonb_build_object('day_record_id', p_day_record_id),
          NULL);

  RETURN jsonb_build_object('success', true);
END;
$$;
