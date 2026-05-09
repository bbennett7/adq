import { NextResponse } from 'next/server';
import { NotFoundError } from '@/lib/api-error';
import { withErrorHandling } from '@/lib/handler';
import { questionService } from '@/lib/services/question.service';

export const GET = withErrorHandling(
	async (_req, { params }: { params: Promise<{ number: string }> }) => {
		const { number } = await params;
		const n = parseInt(number, 10);
		if (Number.isNaN(n) || n < 1 || String(n) !== number) {
			throw new NotFoundError();
		}

		const question = await questionService.getQuestion(n);
		if (!question) {
			throw new NotFoundError(`Question #${n}`);
		}

		return NextResponse.json(question);
	},
);
