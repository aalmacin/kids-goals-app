-- Atomic points update function with zero floor
CREATE OR REPLACE FUNCTION apply_points_delta(kid_id uuid, delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE kids
  SET points = GREATEST(0, points + delta)
  WHERE id = kid_id
  RETURNING points INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kid not found: %', p_kid_id;
  END IF;

  RETURN new_balance;
END;
$$;
