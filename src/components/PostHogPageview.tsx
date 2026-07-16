'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export function PostHogPageview() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!pathname || !posthog.__loaded) return;
		let url = window.origin + pathname;
		const params = searchParams.toString();
		if (params) url += `?${params}`;
		posthog.capture('$pageview', { $current_url: url });
	}, [pathname, searchParams]);

	return null;
}
