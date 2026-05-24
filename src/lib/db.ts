import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from '@/lib/logger';
import * as schema from '@/lib/schema';

const log = logger.child({ module: 'db' });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL env var is required');

log.info('initializing database pool');

const pool = new Pool({
	connectionString: url,
	max: 3,
	connectionTimeoutMillis: 5000,
	idleTimeoutMillis: 10000,
});

pool.on('connect', () => log.info('pool: new connection established'));
pool.on('error', (err) => log.error({ err }, 'pool: connection error'));

attachDatabasePool(pool);

export const db = drizzle({
	client: pool,
	schema,
});
