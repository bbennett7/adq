import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { questions } from '@/lib/schema';
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

export class QuestionRepository {
	private static toPublishedQuestion(row: QuestionRow): PublishedQuestion {
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

	async getQuestion(number: number): Promise<PublishedQuestion | null> {
		const row = await db.query.questions.findFirst({
			columns: questionColumns,
			where: (q, { and, eq, isNotNull, isNull }) =>
				and(
					eq(q.number, number),
					isNotNull(q.publishedAt),
					sql`${questions.publishedAt} <= now()`,
					isNull(q.deletedAt),
				),
			with: {
				questionResources: {
					orderBy: (qr, { asc }) => asc(qr.sortOrder),
					with: { resource: { columns: resourceColumns } },
				},
			},
		});
		return row ? QuestionRepository.toPublishedQuestion(row) : null;
	}

	async getAdjacentQuestions(number: number): Promise<{
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
						sql`${questions.publishedAt} <= now()`,
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
						sql`${questions.publishedAt} <= now()`,
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
			prev: prev ? QuestionRepository.toPublishedQuestion(prev) : null,
			next: next ? QuestionRepository.toPublishedQuestion(next) : null,
		};
	}

	async getRecentQuestions(
		limit: number,
		cursor?: number,
	): Promise<PublishedQuestionsPage> {
		const rows = await db.query.questions.findMany({
			columns: questionColumns,
			where: (q, { and, isNotNull, isNull, lt }) =>
				and(
					isNotNull(q.publishedAt),
					sql`${questions.publishedAt} <= now()`,
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

		const mapped = rows.map(QuestionRepository.toPublishedQuestion);
		const nextCursor =
			mapped.length === limit ? mapped[mapped.length - 1].number : null;

		return { questions: mapped, nextCursor };
	}
}

export const questionRepository = new QuestionRepository();
