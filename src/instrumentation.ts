import type { Instrumentation } from 'next';
import { logger } from '@/lib/logger';

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
	err,
	request,
	context,
) => {
	if (process.env.NEXT_RUNTIME === 'edge') return;
	const message = err instanceof Error ? err.message : String(err);
	const digest =
		err instanceof Error && 'digest' in err
			? (err as { digest?: string }).digest
			: undefined;
	logger.error(
		{
			type: 'InstrumentationError',
			digest,
			method: request.method,
			path: request.path,
			routerKind: context.routerKind,
			routeType: context.routeType,
			routePath: context.routePath,
		},
		message,
	);
};
