#!/bin/bash

# Script to apply LINE login migration
echo "Applying LINE login migration..."

# Get the database URL from .env file
DB_URL=$(grep "POSTGRES_URL" .env | cut -d '=' -f2- | tr -d '"')

if [ -z "$DB_URL" ]; then
  echo "Error: POSTGRES_URL not found in .env file"
  exit 1
fi

# SQL commands to add LINE login fields
SQL_COMMANDS="
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
"

# Execute SQL commands
echo "$SQL_COMMANDS" | psql "$DB_URL"

if [ $? -eq 0 ]; then
  echo "LINE login migration applied successfully!"
else
  echo "Error applying LINE login migration"
  exit 1
fi
