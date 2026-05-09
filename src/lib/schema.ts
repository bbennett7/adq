import { relations } from 'drizzle-orm';
import {
	customType,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

const vector = customType<{
	data: number[];
	driverData: string;
	config: { dimensions: number };
}>({
	dataType(config) {
		return `vector(${config?.dimensions ?? 1536})`;
	},
	fromDriver(value: string): number[] {
		return value.slice(1, -1).split(',').map(Number);
	},
	toDriver(value: number[]): string {
		return `[${value.join(',')}]`;
	},
});

export const questions = pgTable('questions', {
	id: uuid('id').primaryKey().defaultRandom(),
	number: integer('number').unique(),
	questionMd: text('question_md').notNull(),
	questionPt: text('question_pt').notNull(),
	answerMd: text('answer_md').notNull(),
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
	embedding: vector('embedding', { dimensions: 1536 }),
});

export const resources = pgTable('resources', {
	id: uuid('id').primaryKey().defaultRandom(),
	url: text('url').notNull().unique(),
	label: text('label').notNull(),
	source: text('source').notNull(),
	author: text('author'),
	embedding: vector('embedding', { dimensions: 1536 }),
});

export const questionResources = pgTable(
	'question_resources',
	{
		questionId: uuid('question_id')
			.notNull()
			.references(() => questions.id, { onDelete: 'cascade' }),
		resourceId: uuid('resource_id')
			.notNull()
			.references(() => resources.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0),
	},
	(table) => [primaryKey({ columns: [table.questionId, table.resourceId] })],
);

export const questionsRelations = relations(questions, ({ many }) => ({
	questionResources: many(questionResources),
}));

export const resourcesRelations = relations(resources, ({ many }) => ({
	questionResources: many(questionResources),
}));

export const questionResourcesRelations = relations(
	questionResources,
	({ one }) => ({
		question: one(questions, {
			fields: [questionResources.questionId],
			references: [questions.id],
		}),
		resource: one(resources, {
			fields: [questionResources.resourceId],
			references: [resources.id],
		}),
	}),
);
