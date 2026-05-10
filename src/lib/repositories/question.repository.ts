import { sql } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/lib/db';
import type { PublishedQuestion, PublishedQuestionsPage } from '@/lib/schemas';
import { PublishedQuestionSchema } from '@/lib/schemas';

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

function toPublishedQuestion(row: QuestionRow): PublishedQuestion {
	return PublishedQuestionSchema.parse({
		id: row.id,
		number: row.number,
		questionMd: row.questionMd,
		questionPt: row.questionPt,
		answerMd: row.answerMd,
		publishedAt: row.publishedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		deletedAt: row.deletedAt,
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
	'use cache';
	cacheTag(`question-${number}`);
	cacheLife('days');

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
				orderBy: (qr, { asc }) => asc(qr.sortOrder),
				with: { resource: { columns: resourceColumns } },
			},
		},
	});
	return row ? toPublishedQuestion(row) : null;
}

async function fetchAdjacentQuestions(number: number): Promise<{
	prev: PublishedQuestion | null;
	next: PublishedQuestion | null;
}> {
	'use cache';
	cacheTag(`question-${number}`);
	cacheLife('days');

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
					orderBy: (qr, { asc }) => asc(qr.sortOrder),
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
					orderBy: (qr, { asc }) => asc(qr.sortOrder),
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
	'use cache';
	cacheTag('questions');
	cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

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
				orderBy: (qr, { asc }) => asc(qr.sortOrder),
				with: { resource: { columns: resourceColumns } },
			},
		},
	});

	const mapped = rows.map(toPublishedQuestion);
	const nextCursor =
		mapped.length === limit ? mapped[mapped.length - 1].number : null;

	return { questions: mapped, nextCursor };
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
}

export const questionRepository = new QuestionRepository();
