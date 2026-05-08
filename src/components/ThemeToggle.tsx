'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

	useEffect(() => {
		let stored: 'light' | 'dark' | null = null;
		try {
			const raw = localStorage.getItem('theme');
			if (raw === 'light' || raw === 'dark') stored = raw;
		} catch {
			// localStorage unavailable (private browsing, etc.)
		}
		const prefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)',
		).matches;
		const resolved = stored ?? (prefersDark ? 'dark' : 'light');
		document.documentElement.dataset.theme = resolved;
		setTheme(resolved);
	}, []);

	function toggle() {
		const next = theme === 'dark' ? 'light' : 'dark';
		setTheme(next);
		document.documentElement.dataset.theme = next;
		localStorage.setItem('theme', next);
	}

	if (theme === null) {
		return (
			<button
				type="button"
				className="site-footer-theme-toggle"
				tabIndex={-1}
				style={{ visibility: 'hidden' }}
			/>
		);
	}

	return (
		<button
			type="button"
			onClick={toggle}
			className="site-footer-theme-toggle"
			aria-label={
				theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
			}
		>
			{theme === 'dark' ? <SunIcon /> : <MoonIcon />}
		</button>
	);
}

function MoonIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M12.5 9A6 6 0 0 1 5 1.5a.5.5 0 0 0-.6-.6A6.5 6.5 0 1 0 13.1 9.6a.5.5 0 0 0-.6-.6Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function SunIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			aria-hidden="true"
		>
			<circle cx="7" cy="7" r="3" fill="currentColor" />
			<g stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
				<line x1="7" y1="1" x2="7" y2="2.5" />
				<line x1="7" y1="11.5" x2="7" y2="13" />
				<line x1="1" y1="7" x2="2.5" y2="7" />
				<line x1="11.5" y1="7" x2="13" y2="7" />
				<line x1="2.93" y1="2.93" x2="4" y2="4" />
				<line x1="10" y1="10" x2="11.07" y2="11.07" />
				<line x1="11.07" y1="2.93" x2="10" y2="4" />
				<line x1="4" y1="10" x2="2.93" y2="11.07" />
			</g>
		</svg>
	);
}
