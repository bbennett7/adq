import type { QuestionsPage } from './schemas';
import { QuestionsPageSchema } from './schemas';

export async function fetchQuestions(params: {
	limit?: number;
	cursor?: number;
}): Promise<QuestionsPage> {
	const search = new URLSearchParams();
	if (params.limit !== undefined) search.set('limit', String(params.limit));
	if (params.cursor !== undefined) search.set('cursor', String(params.cursor));

	const res = await fetch(`/api/questions?${search}`);
	if (!res.ok) throw new Error('Failed to load questions');
	return QuestionsPageSchema.parse(await res.json());
}
