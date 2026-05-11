import type { Instrumentation } from 'next';
import { logger } from '@/lib/logger';

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
	err,
	request,
	context,
) => {
	if (process.env.NEXT_RUNTIME === 'edge') return;
	const error = err as Error & { digest?: string };
	logger.error(
		{
			type: 'InstrumentationError',
			digest: error.digest,
			method: request.method,
			path: request.path,
			routerKind: context.routerKind,
			routeType: context.routeType,
			routePath: context.routePath,
		},
		error.message,
	);
};
