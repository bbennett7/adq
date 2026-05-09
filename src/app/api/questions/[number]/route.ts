import { NextResponse } from 'next/server';
import { questionService } from '@/lib/services/question.service';

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ number: string }> },
) {
	const { number } = await params;
	const n = parseInt(number, 10);
	if (Number.isNaN(n) || n < 1 || String(n) !== number) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	const question = await questionService.getQuestion(n);
	if (!question) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
	return NextResponse.json(question);
}
