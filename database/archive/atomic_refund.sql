-- Function to atomically refund credits
CREATE OR REPLACE FUNCTION refund_credits_atomic(
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
    RAISE EXCEPTION 'Refund amount must be positive. Provided: %', p_amount;
  END IF;

  -- Validate action is not null or empty
  IF p_action IS NULL OR p_action = '' THEN
    RAISE EXCEPTION 'Action must be a non-empty string';
  END IF;

  -- Lock the user row for update to prevent race conditions
  SELECT credits INTO v_current_credits
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Add credits (Refund)
  -- Prevent integer overflow (int max: 2,147,483,647)
  IF v_current_credits > 2147483647 - p_amount THEN
    RAISE EXCEPTION 'Refund would exceed maximum credits limit';
  END IF;
  v_new_balance := v_current_credits + p_amount;

  UPDATE users
  SET credits = v_new_balance
  WHERE id = p_user_id;

  -- Log transaction with positive amount (Refund)
  -- You might want to prefix action or rely on the caller to provide a clear action name
  INSERT INTO credit_logs (user_id, amount, action)
  VALUES (p_user_id, p_amount, p_action);

  RETURN v_new_balance;
END;
$$;
