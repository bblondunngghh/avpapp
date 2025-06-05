import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection configuration for production stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Further reduced for serverless stability
  idleTimeoutMillis: 30000, // Increase idle timeout
  connectionTimeoutMillis: 10000, // Increase connection timeout
  keepAlive: true,
  maxUses: 7500, // Limit connection reuse
  allowExitOnIdle: false,
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

export const db = drizzle({ client: pool, schema });

// Database operation wrapper with retry logic
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Don't retry on certain errors
      if (error instanceof Error && error.message.includes('syntax error')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff
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