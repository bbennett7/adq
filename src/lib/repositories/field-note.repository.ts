import { sql } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { PublishedFieldNote } from '@/lib/schemas';
import { PublishedFieldNoteSchema } from '@/lib/schemas';

const log = logger.child({ module: 'field-note-repository' });

type FieldNoteRow = {
	id: string;
	title: string;
	slug: string;
	bodyMd: string;
	bodyPt: string | null;
	topic: string | null;
	featured: boolean;
	publishedAt: string | null;
};

const fieldNoteColumns = {
	id: true,
	title: true,
	slug: true,
	bodyMd: true,
	bodyPt: true,
	topic: true,
	featured: true,
	publishedAt: true,
} as const;

function toIso(value: string | null): string | null {
	if (!value) return null;
	return new Date(value).toISOString();
}

function toPublishedFieldNote(row: FieldNoteRow): PublishedFieldNote {
	return PublishedFieldNoteSchema.parse({
		...row,
		publishedAt: toIso(row.publishedAt),
	});
}

async function fetchPublishedNotes(): Promise<PublishedFieldNote[]> {
	'use cache';
	cacheTag('field-notes');
	cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

	log.info('fetching published field notes');
	const rows = await db.query.fieldNotes.findMany({
		columns: fieldNoteColumns,
		where: (n, { and, isNotNull, isNull }) =>
			and(
				isNotNull(n.publishedAt),
				sql`${n.publishedAt} <= now()`,
				isNull(n.deletedAt),
			),
		orderBy: (n, { desc }) => desc(n.publishedAt),
	});
	log.info({ count: rows.length }, 'fetched published field notes');

	return rows.map(toPublishedFieldNote);
}

async function fetchNote(slug: string): Promise<PublishedFieldNote | null> {
	'use cache';
	cacheTag(`note-${slug}`);
	cacheLife({ stale: 60, revalidate: 300, expire: 86400 });

	log.info({ slug }, 'fetching field note');
	const row = await db.query.fieldNotes.findFirst({
		columns: fieldNoteColumns,
		where: (n, { and, eq, isNotNull, isNull }) =>
			and(
				eq(n.slug, slug),
				isNotNull(n.publishedAt),
				sql`${n.publishedAt} <= now()`,
				isNull(n.deletedAt),
			),
	});
	log.info({ slug, found: !!row }, 'fetched field note');
	return row ? toPublishedFieldNote(row) : null;
}

export class FieldNoteRepository {
	async getPublishedNotes(): Promise<PublishedFieldNote[]> {
		return fetchPublishedNotes();
	}

	async getNote(slug: string): Promise<PublishedFieldNote | null> {
		return fetchNote(slug);
	}
}

export const fieldNoteRepository = new FieldNoteRepository();
