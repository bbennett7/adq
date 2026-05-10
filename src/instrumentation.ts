import type { Instrumentation } from 'next';
import { logger } from '@/lib/logger';

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
	err,
	request,
	context,
) => {
	const error = err as { digest: string } & Error;
	logger.error(
		{
			digest: error.digest,
			method: request.method,
			path: request.path,
			routeType: context.routeType,
			routePath: context.routePath,
		},
		error.message,
	);
};
