import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/lib/schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL env var is required');

const pool = new Pool({
	connectionString: url,
	max: 3,
	connectionTimeoutMillis: 5000,
	idleTimeoutMillis: 10000,
});
attachDatabasePool(pool);

export const db = drizzle({
	client: pool,
	schema,
});
