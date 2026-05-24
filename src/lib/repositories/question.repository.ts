import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { PublishedQuestion, PublishedQuestionsPage } from '@/lib/schemas';
import { PublishedQuestionSchema } from '@/lib/schemas';

const log = logger.child({ module: 'question-repository' });

const questionColumns = { embedding: false } as const;
const resourceColumns = { embedding: false } as const;

type QuestionRow = {
	id: string;
	number: number | null;
	questionMd: string;
	questionPt: string;
	answerMd: string;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	questionResources: Array<{
		resource: {
			url: string;
			label: string;
			source: string;
			author: string | null;
		};
	}>;
};

function toIso(value: string | null): string | null {
	if (!value) return null;
	return new Date(value).toISOString();
}

function toPublishedQuestion(row: QuestionRow): PublishedQuestion {
	return PublishedQuestionSchema.parse({
		id: row.id,
		number: row.number,
		questionMd: row.questionMd,
		questionPt: row.questionPt,
		answerMd: row.answerMd,
		publishedAt: toIso(row.publishedAt),
		createdAt: toIso(row.createdAt),
		updatedAt: toIso(row.updatedAt),
		deletedAt: toIso(row.deletedAt),
		resources: row.questionResources.map(({ resource }) => ({
			label: resource.label,
			url: resource.url,
			source: resource.source,
			author: resource.author ?? undefined,
		})),
	});
}

async function fetchQuestion(
	number: number,
): Promise<PublishedQuestion | null> {
	log.info({ number }, 'fetching question');
	const row = await db.query.questions.findFirst({
		columns: questionColumns,
		where: (q, { and, eq, isNotNull, isNull }) =>
			and(
				eq(q.number, number),
				isNotNull(q.publishedAt),
				sql`${q.publishedAt} <= now()`,
				isNull(q.deletedAt),
			),
		with: {
			questionResources: {
				orderBy: (qr, { asc }) => asc(qr.questionId),
				with: { resource: { columns: resourceColumns } },
			},
		},
	});
	log.info({ number, found: !!row }, 'fetched question');
	return row ? toPublishedQuestion(row) : null;
}

async function fetchAdjacentQuestions(number: number): Promise<{
	prev: PublishedQuestion | null;
	next: PublishedQuestion | null;
}> {
	const [prev, next] = await Promise.all([
		db.query.questions.findFirst({
			columns: questionColumns,
			where: (q, { and, lt, isNotNull, isNull }) =>
				and(
					lt(q.number, number),
					isNotNull(q.publishedAt),
					sql`${q.publishedAt} <= now()`,
					isNull(q.deletedAt),
				),
			orderBy: (q, { desc }) => desc(q.number),
			with: {
				questionResources: {
					orderBy: (qr, { asc }) => asc(qr.questionId),
					with: { resource: { columns: resourceColumns } },
				},
			},
		}),
		db.query.questions.findFirst({
			columns: questionColumns,
			where: (q, { and, gt, isNotNull, isNull }) =>
				and(
					gt(q.number, number),
					isNotNull(q.publishedAt),
					sql`${q.publishedAt} <= now()`,
					isNull(q.deletedAt),
				),
			orderBy: (q, { asc }) => asc(q.number),
			with: {
				questionResources: {
					orderBy: (qr, { asc }) => asc(qr.questionId),
					with: { resource: { columns: resourceColumns } },
				},
			},
		}),
	]);

	return {
		prev: prev ? toPublishedQuestion(prev) : null,
		next: next ? toPublishedQuestion(next) : null,
	};
}

async function fetchRecentQuestions(
	limit: number,
	cursor?: number,
): Promise<PublishedQuestionsPage> {
	log.info({ limit, cursor }, 'fetching recent questions');
	const rows = await db.query.questions.findMany({
		columns: questionColumns,
		where: (q, { and, isNotNull, isNull, lt }) =>
			and(
				isNotNull(q.publishedAt),
				sql`${q.publishedAt} <= now()`,
				isNull(q.deletedAt),
				cursor !== undefined ? lt(q.number, cursor) : undefined,
			),
		orderBy: (q, { desc }) => desc(q.number),
		limit,
		with: {
			questionResources: {
				orderBy: (qr, { asc }) => asc(qr.questionId),
				with: { resource: { columns: resourceColumns } },
			},
		},
	});
	log.info({ limit, cursor, count: rows.length }, 'fetched recent questions');

	const mapped = rows.map(toPublishedQuestion);
	const nextCursor =
		mapped.length === limit ? mapped[mapped.length - 1].number : null;

	return { questions: mapped, nextCursor };
}

async function fetchLatestQuestionNumber(): Promise<number> {
	log.info('fetching latest question number');
	const row = await db.query.questions.findFirst({
		columns: { number: true },
		where: (q, { and, isNotNull, isNull }) =>
			and(
				isNotNull(q.publishedAt),
				sql`${q.publishedAt} <= now()`,
				isNull(q.deletedAt),
			),
		orderBy: (q, { desc }) => desc(q.number),
	});
	log.info({ number: row?.number ?? 0 }, 'fetched latest question number');

	return row?.number ?? 0;
}

export class QuestionRepository {
	async getQuestion(number: number): Promise<PublishedQuestion | null> {
		return fetchQuestion(number);
	}

	async getAdjacentQuestions(number: number): Promise<{
		prev: PublishedQuestion | null;
		next: PublishedQuestion | null;
	}> {
		return fetchAdjacentQuestions(number);
	}

	async getRecentQuestions(
		limit: number,
		cursor?: number,
	): Promise<PublishedQuestionsPage> {
		return fetchRecentQuestions(limit, cursor);
	}

	async getLatestQuestionNumber(): Promise<number> {
		return fetchLatestQuestionNumber();
	}
}

export const questionRepository = new QuestionRepository();
