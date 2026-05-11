import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@/lib/api-error';
import { withErrorHandling } from '@/lib/handler';
import { parseJsonBody } from '@/lib/request';
import { RevalidateBodySchema } from '@/lib/schemas';

const REVALIDATION_SECRET_HEADER = 'x-revalidation-secret';

export const POST = withErrorHandling(async (request) => {
	const secret = request.headers.get(REVALIDATION_SECRET_HEADER);
	if (
		!process.env.REVALIDATION_SECRET ||
		secret !== process.env.REVALIDATION_SECRET
	) {
		throw new UnauthorizedError();
	}

	const body = RevalidateBodySchema.parse(await parseJsonBody(request));

	revalidateTag('questions', 'minutes');
	for (const n of body.questionNumbers) {
		revalidateTag(`question-${n}`, 'days');
	}

	return NextResponse.json({ revalidated: true });
});
