import * as fs from 'node:fs';
import * as path from 'node:path';
import { sql } from '../src/lib/db';

async function migrate() {
	await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

	const applied = new Set(
		(await sql`SELECT filename FROM schema_migrations`).map(
			(r) => r.filename as string,
		),
	);

	const migrationsDir = path.join(process.cwd(), 'migrations');
	const files = fs
		.readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort();

	for (const file of files) {
		if (applied.has(file)) {
			console.log(`Skipping: ${file} (already applied)`);
			continue;
		}
		const migrationSql = fs.readFileSync(
			path.join(migrationsDir, file),
			'utf-8',
		);
		console.log(`Running: ${file}`);
		await sql.unsafe(migrationSql);
		await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
		console.log(`  ✓ ${file}`);
	}

	console.log('Done.');
}

migrate().catch((err) => {
	console.error(err);
	process.exit(1);
});
