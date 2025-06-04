'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Applying LINE login migration...');
    
    // SQL commands to add LINE login fields
    const migrations = [
      // Add LINE login fields to users table
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS line_id VARCHAR(100) UNIQUE`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS line_access_token TEXT`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS line_refresh_token TEXT`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS line_token_expires_at TIMESTAMP`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(100)`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS line_picture_url TEXT`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email'`,
      
      // Make password_hash nullable (to support social login)
      sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`
    ];
    
    // Execute each migration query
    for (const migration of migrations) {
      await db.execute(migration);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'LINE login migration applied successfully!' 
    });
  } catch (error) {
    console.error('Error applying LINE login migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
