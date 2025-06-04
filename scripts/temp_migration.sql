-- Add LINE login fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_id VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_token_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';

-- Make password_hash nullable (to support social login)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
