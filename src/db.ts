import 'dotenv/config';
import { Pool } from 'pg';
import type { Database } from './app';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const port = Number(requiredEnv('DB_PORT'));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535');
}

const pgPool = new Pool({
  host: requiredEnv('DB_HOST'),
  port,
  database: requiredEnv('DB_NAME'),
  user: requiredEnv('DB_USER'),
  password: requiredEnv('DB_PASSWORD'),
  max: 10,
  connectionTimeoutMillis: 3_000,
  idleTimeoutMillis: 30_000,
});

export const database = pgPool as unknown as Database;

export async function closeDatabase(): Promise<void> {
  await pgPool.end();
}
