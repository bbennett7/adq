import { z } from 'zod/v4';

export const ResourceLinkSchema = z.object({
	label: z.string().min(1),
	url: z
		.url()
		.refine((u) => u.startsWith('https://'), {
			message: 'URL must use https',
		}),
	source: z.string().min(1),
	author: z.string().optional(),
});

export const QUERY_LIMIT_MAX = 50;

export const QuestionSchema = z.object({
	id: z.uuid(),
	number: z.number().int().positive(),
	questionMd: z
		.string()
		.min(1)
		.refine((s) => !s.includes('\n\n'), {
			message: 'Question must be a single paragraph',
		}),
	questionPt: z.string().min(1),
	answerMd: z.string().min(1),
	publishedAt: z.iso.datetime(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	deletedAt: z.iso.datetime().nullable(),
	resources: z.array(ResourceLinkSchema).optional(),
});

export const QuestionsPageSchema = z.object({
	questions: z.array(QuestionSchema),
	nextCursor: z.number().int().positive().nullable(),
});

export const QuestionsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(QUERY_LIMIT_MAX).default(10),
	/** Exclusive upper bound on question.number — DB query: WHERE number < cursor ORDER BY number DESC */
	cursor: z.coerce.number().int().positive().optional(),
});

export const ApiErrorSchema = z.object({
	error: z.string(),
});

export type ResourceLink = z.infer<typeof ResourceLinkSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionsPage = z.infer<typeof QuestionsPageSchema>;
export type QuestionsQuery = z.infer<typeof QuestionsQuerySchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
