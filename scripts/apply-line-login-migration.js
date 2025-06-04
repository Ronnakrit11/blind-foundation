// Script to apply LINE login migration
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('Error: POSTGRES_URL environment variable is not set');
  process.exit(1);
}

// Path to the migration SQL file
const migrationFilePath = path.join(__dirname, '../lib/db/migrations/add_line_login_fields.sql');

try {
  console.log('Applying LINE login migration...');
  
  // Check if the migration file exists
  if (!fs.existsSync(migrationFilePath)) {
    console.error(`Error: Migration file not found at ${migrationFilePath}`);
    process.exit(1);
  }
  
  // Read the migration SQL
  const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
  
  // Create a temporary file with the SQL
  const tempFilePath = path.join(__dirname, 'temp_migration.sql');
  fs.writeFileSync(tempFilePath, migrationSQL);
  
  // Execute the SQL against the database
  execSync(`psql "${POSTGRES_URL}" -f ${tempFilePath}`, { stdio: 'inherit' });
  
  // Clean up the temporary file
  fs.unlinkSync(tempFilePath);
  
  console.log('LINE login migration applied successfully!');
} catch (error) {
  console.error('Error applying migration:', error);
  process.exit(1);
}
