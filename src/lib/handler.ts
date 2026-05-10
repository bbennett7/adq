import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export function withErrorHandling<Args extends unknown[]>(
	handler: (request: Request, ...args: Args) => Promise<NextResponse>,
): (request: Request, ...args: Args) => Promise<NextResponse> {
	return async (request, ...args) => {
		const ctx = {
			method: request.method,
			path: new URL(request.url).pathname,
		};

		try {
			return await handler(request, ...args);
		} catch (err) {
			if (err instanceof AppError) {
				logger.error(
					{ ...ctx, status: err.status, type: err.name, cause: err.cause },
					err.message,
				);
				return NextResponse.json(
					{ error: err.message },
					{ status: err.status },
				);
			}

			if (err instanceof ZodError) {
				logger.error(
					{ ...ctx, type: 'ZodError', issues: err.issues },
					'Invalid request',
				);
				return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
			}

			logger.error(
				{ ...ctx, type: 'UnknownError', err },
				'Internal server error',
			);
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 },
			);
		}
	};
}
