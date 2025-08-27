import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection configuration for Railway PostgreSQL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', (client) => {
  console.log('Database client connected');
});

pool.on('remove', (client) => {
  console.log('Database client removed');
});

export const db = drizzle(pool, { schema });

// Database operation wrapper with retry logic
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Set a 5-second timeout for each database operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timeout')), 5000);
      });
      
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Don't retry on certain errors or Control plane failures
      if (error instanceof Error && (
        error.message.includes('syntax error') ||
        error.message.includes('Control plane request failed') ||
        error.message.includes('Database operation timeout')
      )) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        // Shorter backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await pool.end();
  process.exit(0);
});