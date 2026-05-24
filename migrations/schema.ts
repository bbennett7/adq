import {
	foreignKey,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid,
	vector,
} from 'drizzle-orm/pg-core';

export const agent = pgEnum('agent', ['claude', 'gpt4', 'gemini']);
export const candidateStatus = pgEnum('candidate_status', [
	'pending',
	'selected',
	'rejected',
	'rescued',
]);
export const runStatus = pgEnum('run_status', [
	'running',
	'awaiting_review',
	'published',
	'failed',
]);

export const questions = pgTable(
	'questions',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		number: integer(),
		questionMd: text('question_md').notNull(),
		questionPt: text('question_pt').notNull(),
		answerMd: text('answer_md').notNull(),
		publishedAt: timestamp('published_at', {
			withTimezone: true,
			mode: 'string',
		}),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
		embedding: vector({ dimensions: 1536 }),
	},
	(table) => [unique('questions_number_key').on(table.number)],
);

export const pipelineRuns = pgTable(
	'pipeline_runs',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		targetDate: timestamp('target_date', {
			withTimezone: true,
			mode: 'string',
		}).notNull(),
		status: runStatus().default('running').notNull(),
		errorMessage: text('error_message'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
	},
	(table) => [unique('pipeline_runs_target_date_unique').on(table.targetDate)],
);

export const candidates = pgTable(
	'candidates',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		runId: uuid('run_id').notNull(),
		agent: agent().notNull(),
		questionMd: text('question_md').notNull(),
		answerMd: text('answer_md').notNull(),
		score: integer().notNull(),
		reviewReason: text('review_reason').notNull(),
		status: candidateStatus().default('pending').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
		questionId: uuid('question_id'),
	},
	(table) => [
		index('candidates_question_id_idx').using(
			'btree',
			table.questionId.asc().nullsLast().op('uuid_ops'),
		),
		index('candidates_run_id_idx').using(
			'btree',
			table.runId.asc().nullsLast().op('uuid_ops'),
		),
		foreignKey({
			columns: [table.runId],
			foreignColumns: [pipelineRuns.id],
			name: 'candidates_run_id_pipeline_runs_id_fk',
		}),
	],
);

export const vacations = pgTable('vacations', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	startDate: timestamp('start_date', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	endDate: timestamp('end_date', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
});

export const resources = pgTable(
	'resources',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		url: text().notNull(),
		label: text().notNull(),
		source: text().notNull(),
		author: text(),
		embedding: vector({ dimensions: 1536 }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
	},
	(table) => [unique('resources_url_unique').on(table.url)],
);

export const questionResources = pgTable(
	'question_resources',
	{
		questionId: uuid('question_id').notNull(),
		resourceId: uuid('resource_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: 'question_resources_question_id_questions_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: 'question_resources_resource_id_resources_id_fk',
		}).onDelete('cascade'),
		primaryKey({
			columns: [table.questionId, table.resourceId],
			name: 'question_resources_question_id_resource_id_pk',
		}),
	],
);

export const verificationTokens = pgTable(
	'verification_tokens',
	{
		identifier: text().notNull(),
		token: text().notNull(),
		expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
		attempts: integer().default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('verification_tokens_identifier_idx').using(
			'btree',
			table.identifier.asc().nullsLast().op('text_ops'),
		),
		primaryKey({
			columns: [table.identifier, table.token],
			name: 'verification_tokens_identifier_token_pk',
		}),
	],
);
