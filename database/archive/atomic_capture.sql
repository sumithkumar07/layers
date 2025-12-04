-- Function to atomically capture memories (deduct credits + insert)
CREATE OR REPLACE FUNCTION capture_memory_atomic(
  p_user_id uuid,
  p_cost int,
  p_memories jsonb,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits int;
  v_new_balance int;
  v_memory jsonb;
  v_inserted_ids bigint[];
  v_id bigint;
BEGIN
  -- 1. Validate amount
  IF p_cost < 0 THEN
    RAISE EXCEPTION 'Cost must be non-negative. Provided: %', p_cost;
  END IF;

  -- 1.5 Authorization Check
  -- Since this function runs as SECURITY DEFINER (superuser privileges),
  -- we MUST explicitly verify that the caller is operating on their own data.
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only capture memories for your own account.';
  END IF;

  -- 2. Lock user and check credits
  SELECT credits INTO v_current_credits
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_current_credits < p_cost THEN
    RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', p_cost, v_current_credits;
  END IF;

  -- 3. Deduct credits
  v_new_balance := v_current_credits - p_cost;

  UPDATE users
  SET credits = v_new_balance
  WHERE id = p_user_id;

  -- 4. Log transaction
  INSERT INTO credit_logs (user_id, amount, action)
  VALUES (p_user_id, -p_cost, p_action);

  -- 5. Insert Memories
  -- p_memories is a JSON array of objects: {content, embedding, tags}
  
  FOR v_memory IN SELECT * FROM jsonb_array_elements(p_memories)
  LOOP
    IF v_memory->>'content' IS NULL THEN
      RAISE EXCEPTION 'Memory object missing required field: content';
    END IF;
    IF v_memory->>'embedding' IS NULL THEN
      RAISE EXCEPTION 'Memory object missing required field: embedding';
    END IF;
    IF v_memory->'tags' IS NULL OR jsonb_typeof(v_memory->'tags') != 'array' THEN
      RAISE EXCEPTION 'Memory object missing required field: tags';
    END IF;

    -- Validate embedding can be cast to vector
    BEGIN
      PERFORM (v_memory->>'embedding')::vector;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Memory embedding is not a valid vector format: %', 
                      v_memory->>'embedding';
    END;
    INSERT INTO memories (user_id, content, embedding, tags)
    VALUES (
      p_user_id,
      v_memory->>'content',
      (v_memory->>'embedding')::vector,
      (SELECT array_agg(x) FROM jsonb_array_elements_text(v_memory->'tags') t(x))
    )
    RETURNING id INTO v_id;
    
    v_inserted_ids := array_append(v_inserted_ids, v_id);
  END LOOP;

  -- 5.5. Log capture event for observability
  INSERT INTO memory_capture_log (user_id, cost, memory_count, inserted_ids, action)
  VALUES (
    p_user_id,
    p_cost,
    array_length(v_inserted_ids, 1),
    v_inserted_ids,
    p_action
  );

  -- 6. Return success info
  RETURN jsonb_build_object(
    'status', 'success',
    'new_balance', v_new_balance,
    'inserted_ids', v_inserted_ids
  );

EXCEPTION WHEN OTHERS THEN
  -- Implicit rollback happens, but we can log or re-raise
  RAISE;
END;
$$;
