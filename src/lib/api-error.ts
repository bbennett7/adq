/**
 * Base class for all application errors. Subclass for specific HTTP status codes.
 * @param status - HTTP status code to return to the client
 * @param message - Human-readable error message returned in the response body
 * @param cause - The original error caught in a catch block, retained for server-side logging
 */
export abstract class AppError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = 'AppError';
	}
}

/** Thrown when a request lacks valid authentication credentials. Returns 401. */
export class UnauthorizedError extends AppError {
	constructor() {
		super(401, 'Unauthorized');
		this.name = 'UnauthorizedError';
	}
}

/**
 * Thrown when the request is malformed or fails validation. Returns 400.
 * @param message - Description of what was invalid
 * @param cause - The original error caught in a catch block, retained for server-side logging
 */
export class BadRequestError extends AppError {
	constructor(message: string, cause?: unknown) {
		super(400, message, cause);
		this.name = 'BadRequestError';
	}
}

/**
 * Thrown when a requested resource does not exist. Returns 404.
 * @param message - Optional resource description, e.g. `"Question #42"`. Prefixed with "Not Found:" in the response.
 * @param cause - The original error caught in a catch block, retained for server-side logging
 */
export class NotFoundError extends AppError {
	constructor(message?: string, cause?: unknown) {
		super(404, message ? `Not Found: ${message}` : 'Not Found', cause);
		this.name = 'NotFoundError';
	}
}
