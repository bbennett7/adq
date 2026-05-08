import type { QuestionsPage } from './schemas';
import { ApiErrorSchema, QuestionsPageSchema } from './schemas';

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
	const res = await fetch(url, options);
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		const parsed = body ? ApiErrorSchema.safeParse(body) : null;
		throw new Error(
			parsed?.success ? parsed.data.error : `Request failed: ${res.status}`,
		);
	}
	return res;
}

export async function fetchQuestions(params: {
	limit?: number;
	cursor?: number;
}): Promise<QuestionsPage> {
	const search = new URLSearchParams();
	if (params.limit !== undefined) search.set('limit', String(params.limit));
	if (params.cursor !== undefined) search.set('cursor', String(params.cursor));

	const res = await apiFetch(`/api/questions?${search}`);
	return QuestionsPageSchema.parse(await res.json());
}
