import { cache } from 'react';
import type { Question, QuestionsPage } from './schemas';
import { stubRecent, stubToday } from './stub-data';

export type { Question, QuestionsPage };

export const getLatestQuestion = cache(async (): Promise<Question> => {
	// TODO: query most recent published, non-deleted question where publishedAt <= now and deletedAt IS NULL
	return stubToday;
});

export const getRecentQuestions = cache(
	async (params: {
		limit?: number;
		cursor?: number; // exclusive upper bound on question number; absent = start from most recent
	}): Promise<QuestionsPage> => {
		const limit = params.limit ?? 10;

		// TODO: real implementation uses WHERE number < $cursor (if cursor provided) AND deletedAt IS NULL
		// ORDER BY number DESC LIMIT $limit — do NOT use POSITIVE_INFINITY sentinel in SQL
		const { cursor } = params;
		const filtered =
			cursor === undefined
				? stubRecent.slice(0, limit)
				: stubRecent.filter((q) => q.number < cursor).slice(0, limit);

		const nextCursor =
			filtered.length === limit ? filtered[filtered.length - 1].number : null;

		return { questions: filtered, nextCursor };
	},
);
