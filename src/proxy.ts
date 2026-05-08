// In-memory rate limiter — not suitable for multi-instance production.
// Replace with @upstash/ratelimit + Vercel KV when connecting a real DB.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const requests = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 100;

export function proxy(req: NextRequest) {
	const ip =
		req.headers.get('x-real-ip') ??
		req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		'anonymous';
	const now = Date.now();

	for (const [key, val] of requests) {
		if (now >= val.reset) requests.delete(key);
	}

	const entry = requests.get(ip);

	if (!entry || now >= entry.reset) {
		requests.set(ip, { count: 1, reset: now + WINDOW_MS });
		return NextResponse.next();
	}

	entry.count += 1;
	if (entry.count > LIMIT) {
		return NextResponse.json(
			{ error: 'Too Many Requests' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(WINDOW_MS / 1000)) },
			},
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: '/api/:path*',
};
