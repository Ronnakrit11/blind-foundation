import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Check for environment variable
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// For server-side only operations
declare global {
  var client: ReturnType<typeof postgres> | undefined;
  var db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

// Create postgres client (cached for development hot reloading)
const client = global.client || postgres(process.env.POSTGRES_URL!);

// Create drizzle database instance
const db = global.db || drizzle(client, { schema });

// In development, maintain connection across hot reloads
if (process.env.NODE_ENV === 'development') {
  global.client = client;
  global.db = db;
}

export { client, db };
