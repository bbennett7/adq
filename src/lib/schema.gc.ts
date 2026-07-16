// Ground Ctrl schema — read-only access from this repo, never migrated here.
// field_notes is owned and migrated by adq-groundcontrol (lib/schema.ts);
// keep this definition in sync with it.
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

export const fieldNotes = pgTable(
	'field_notes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: text('title').notNull(),
		slug: text('slug').notNull().unique(),
		bodyMd: text('body_md').notNull(),
		bodyPt: text('body_pt'),
		topic: text('topic'),
		featured: boolean('featured').notNull().default(false),
		publishedAt: timestamp('published_at', {
			withTimezone: true,
			mode: 'string',
		}),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.notNull()
			.defaultNow(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
	},
	(t) => [index('field_notes_slug_idx').on(t.slug)],
);
