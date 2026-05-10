import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/handler';
import { QuestionsQuerySchema } from '@/lib/schemas';
import { questionService } from '@/lib/services/question.service';

export const GET = withErrorHandling(async (request) => {
	const { searchParams } = new URL(request.url);

	const query = QuestionsQuerySchema.parse({
		limit: searchParams.get('limit') ?? undefined,
		cursor: searchParams.get('cursor') ?? undefined,
	});

	const page = await questionService.getRecentQuestions(
		query.limit,
		query.cursor,
	);
	return NextResponse.json(page);
});
