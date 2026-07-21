import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { withErrorHandling } from '@/lib/handler';
import { logger } from '@/lib/logger';
import { parseJsonBody } from '@/lib/request';
import { SubscribeBodySchema } from '@/lib/schemas';

function getResend() {
	return new Resend(process.env.RESEND_API_KEY);
}

export const POST = withErrorHandling(async (request) => {
	const body = SubscribeBodySchema.parse(await parseJsonBody(request));

	// Account-level contact (Resend's post-audiences "Segments" model).
	// The SDK returns { data, error } rather than throwing.
	const { error } = await getResend().contacts.create({ email: body.email });

	// A repeat signup must still read as success to the subscriber.
	if (error && !/already exists/i.test(error.message)) {
		logger.error(
			{ name: error.name, message: error.message },
			'Resend contact creation failed',
		);
		return NextResponse.json({ error: 'Subscription failed' }, { status: 502 });
	}

	return NextResponse.json({ subscribed: true });
});
