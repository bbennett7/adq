'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
		if (!key || posthog.__loaded) return;
		posthog.init(key, {
			api_host: '/ingest',
			ui_host: 'https://us.posthog.com',
			capture_pageview: false,
			capture_pageleave: true,
			persistence: 'localStorage+cookie',
		});
	}, []);

	return <PHProvider client={posthog}>{children}</PHProvider>;
}
