export const revalidate = 60;

import { NextResponse } from 'next/server';
import { getRecentQuestions } from '@/lib/data';
import { QuestionsQuerySchema } from '@/lib/schemas';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const parsed = QuestionsQuerySchema.safeParse({
		limit: searchParams.get('limit') ?? undefined,
		cursor: searchParams.get('cursor') ?? undefined,
	});

	if (!parsed.success) {
		console.error('Invalid query parameters', parsed.error.issues);
		return NextResponse.json(
			{ error: 'Invalid query parameters' },
			{ status: 400 },
		);
	}

	const page = await getRecentQuestions(parsed.data);
	return NextResponse.json(page);
}
