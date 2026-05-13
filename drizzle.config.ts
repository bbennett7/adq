import { defineConfig } from 'drizzle-kit';

try {
	process.loadEnvFile('.env.local');
} catch {}

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/schema.ts',
	out: './migrations',
	dbCredentials: {
		url: process.env.DATABASE_URL ?? '',
	},
});
