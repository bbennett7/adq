import { NextResponse } from 'next/server';
import { ZodError } from 'zod/v4';
import { AppError } from '@/lib/api-error';

export function withErrorHandling<Args extends unknown[]>(
	handler: (request: Request, ...args: Args) => Promise<NextResponse>,
): (request: Request, ...args: Args) => Promise<NextResponse> {
	return async (request, ...args) => {
		try {
			return await handler(request, ...args);
		} catch (err) {
			if (err instanceof AppError) {
				if (err.cause) {
					console.error(err, err.cause);
				} else {
					console.error(err);
				}
				return NextResponse.json(
					{ error: err.message },
					{ status: err.status },
				);
			}

			if (err instanceof ZodError) {
				console.error(err);
				return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
			}

			console.error(err);
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 },
			);
		}
	};
}
