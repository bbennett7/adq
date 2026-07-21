import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { withErrorHandling } from '@/lib/handler';
import { parseJsonBody } from '@/lib/request';
import { SubscribeBodySchema } from '@/lib/schemas';

function getResend() {
	return new Resend(process.env.RESEND_API_KEY);
}

export const POST = withErrorHandling(async (request) => {
	const body = SubscribeBodySchema.parse(await parseJsonBody(request));

	await getResend().contacts.create({
		email: body.email,
		audienceId: process.env.RESEND_AUDIENCE_ID as string,
	});

	return NextResponse.json({ subscribed: true });
});
