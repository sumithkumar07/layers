CREATE TABLE IF NOT EXISTS image_provenance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_hash TEXT NOT NULL,
    filename TEXT NOT NULL,
    gps_data JSONB);
-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_image_provenance_user_id ON image_provenance(user_id);
CREATE INDEX IF NOT EXISTS idx_image_provenance_image_hash ON image_provenance(image_hash);
CREATE INDEX IF NOT EXISTS idx_image_provenance_created_at ON image_provenance(created_at);