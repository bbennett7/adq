import { cache } from 'react';
import type { Question, QuestionsPage } from './schemas';
import { stubRecent, stubToday } from './stub-data';

export const getLatestQuestion = cache(async (): Promise<Question> => {
	// TODO: query most recent published, non-deleted question where publishedAt <= now and deletedAt IS NULL
	return stubToday;
});

export const getQuestion = cache(
	async (number: number): Promise<Question | null> => {
		// TODO: SELECT * FROM questions LEFT JOIN further_reading ... WHERE number = $number AND deletedAt IS NULL
		const found = stubRecent.find((q) => q.number === number);
		return found ?? null;
	},
);

export const getAdjacentQuestions = cache(
	async (
		number: number,
	): Promise<{ prev: Question | null; next: Question | null }> => {
		// TODO: prev = WHERE number < $number AND deletedAt IS NULL ORDER BY number DESC LIMIT 1
		//       next = WHERE number > $number AND deletedAt IS NULL ORDER BY number ASC LIMIT 1
		const sorted = [...stubRecent].sort((a, b) => a.number - b.number);
		const prev = [...sorted].reverse().find((q) => q.number < number) ?? null;
		const next = sorted.find((q) => q.number > number) ?? null;
		return { prev, next };
	},
);

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
