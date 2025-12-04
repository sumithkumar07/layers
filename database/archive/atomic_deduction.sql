-- Function to atomically check and deduct credits
CREATE OR REPLACE FUNCTION deduct_credits_atomic(
  p_user_id uuid,
  p_amount int,
  p_action text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits int;
  v_new_balance int;
BEGIN
  -- Validate that amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive. Provided: %', p_amount;
  END IF;

  -- Lock the user row for update to prevent race conditions
  SELECT credits INTO v_current_credits
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if sufficient credits
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', p_amount, v_current_credits;
  END IF;

  -- Deduct credits
  v_new_balance := v_current_credits - p_amount;

  UPDATE users
  SET credits = v_new_balance
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO credit_logs (user_id, amount, action)
  VALUES (p_user_id, -p_amount, p_action);

  RETURN v_new_balance;
END;
$$;
