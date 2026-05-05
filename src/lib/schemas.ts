import { z } from 'zod/v4';

export const QuestionSchema = z.object({
	id: z.uuid(),
	number: z.number().int().positive(),
	questionMd: z.string().min(1),
	questionPt: z.string().min(1),
	answerMd: z.string(),
	publishedAt: z.iso.datetime(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	deletedAt: z.iso.datetime().nullable(),
});

export const QuestionsPageSchema = z.object({
	questions: z.array(QuestionSchema),
	nextCursor: z.number().int().positive().nullable(),
});

export const QuestionsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
	cursor: z.coerce.number().int().positive().optional(),
});

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionsPage = z.infer<typeof QuestionsPageSchema>;
export type QuestionsQuery = z.infer<typeof QuestionsQuerySchema>;
