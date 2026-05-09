import { BadRequestError } from '@/lib/api-error';

/**
 * Parses the request body as JSON, throwing `BadRequestError` if the body is not valid JSON.
 * @param request - The incoming request
 */
export async function parseJsonBody(request: Request): Promise<unknown> {
	return request.json().catch(() => {
		throw new BadRequestError('Invalid JSON body');
	});
}
