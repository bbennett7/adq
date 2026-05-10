import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL env var is required');

export const sql = neon(url);
export const db = drizzle(sql, { schema });
