-- Create audit log table for memory capture observability
CREATE TABLE IF NOT EXISTS memory_capture_log (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    captured_at timestamptz NOT NULL DEFAULT now(),
    cost int NOT NULL,
    memory_count int NOT NULL,
    inserted_ids bigint[] NOT NULL,
    action text NOT NULL
);

-- Add index for querying by user and time
CREATE INDEX IF NOT EXISTS idx_memory_capture_log_user_time 
ON memory_capture_log(user_id, captured_at DESC);

-- Add RLS policies
ALTER TABLE memory_capture_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own capture logs
CREATE POLICY memory_capture_log_select_policy ON memory_capture_log
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only the function can insert (via SECURITY DEFINER)
CREATE POLICY memory_capture_log_insert_policy ON memory_capture_log
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Prevent updates to audit logs (immutable)
CREATE POLICY memory_capture_log_update_policy ON memory_capture_log
    FOR UPDATE
    WITH CHECK (FALSE);

-- Prevent deletes to audit logs (immutable)
CREATE POLICY memory_capture_log_delete_policy ON memory_capture_log
    FOR DELETE
    USING (FALSE);
