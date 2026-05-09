import { NextResponse } from 'next/server';
import { QuestionsQuerySchema } from '@/lib/schemas';
import { questionService } from '@/lib/services/question.service';

export const revalidate = 60;

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

	const page = await questionService.getRecentQuestions(
		parsed.data.limit,
		parsed.data.cursor,
	);
	return NextResponse.json(page);
}
