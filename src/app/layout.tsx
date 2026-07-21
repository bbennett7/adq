import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { PostHogPageview } from '@/components/PostHogPageview';
import { PostHogProvider } from '@/components/PostHogProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { questionRepository } from '@/lib/repositories/question.repository';
import './globals.css';

export const metadata: Metadata = {
	title: 'askdumbquestions.ai',
	description: 'One question. One answer. Every weekday.',
	metadataBase: new URL('https://askdumbquestions.ai'),
	openGraph: {
		title: 'askdumbquestions.ai',
		description: 'One question. One answer. Every weekday.',
		url: 'https://askdumbquestions.ai',
		siteName: 'askdumbquestions.ai',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'askdumbquestions.ai',
		description: 'One question. One answer. Every weekday.',
	},
};

const themeScript = `(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;})();`;

async function QuestionCount() {
	await connection();
	const count = await questionRepository.getLatestQuestionNumber();
	return (
		<>
			<b>{count}</b> answered &nbsp;·&nbsp; <b className="counter-inf">∞</b>{' '}
			remaining
		</>
	);
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: FOUC-prevention script must run before paint */}
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin=""
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Elms+Sans:wght@400;500;600;700&family=Fanwood+Text:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body>
				<PostHogProvider>
					<Suspense fallback={null}>
						<PostHogPageview />
					</Suspense>
					<header className="site-header">
						<div className="site-header-inner wrap">
							<div className="site-header-counter">
								<Suspense>
									<QuestionCount />
								</Suspense>
							</div>
							<Link href="/" className="wordmark wordmark--nav">
								askdumbquestions.ai
							</Link>
							<nav className="site-header-nav">
								<Link href="/archive">Archive</Link>
								<Link href="/notes">Field Notes</Link>
								<span className="site-header-nav-disabled">Resources</span>
								<Link href="/about">About</Link>
								<ThemeToggle />
							</nav>
						</div>
					</header>

					<main className="wrap">{children}</main>

					<footer className="site-footer">
						<div className="wrap site-footer-inner">
							<div>
								<Link href="/" className="site-footer-wordmark">
									askdumbquestions.ai
								</Link>
								<div className="site-footer-tagline">
									One question · One answer · Every weekday
								</div>
								<div className="site-footer-tagline">
									<a
										href="https://brynbennett.dev"
										target="_blank"
										rel="noopener noreferrer"
									>
										BRYNBENNETT.DEV
									</a>
								</div>
							</div>
							<div className="site-footer-right">
								<a
									href="mailto:bryn@askdumbquestions.ai"
									className="site-footer-contact"
								>
									Contact
								</a>
								<div className="site-footer-icons">
									{/* biome-ignore lint/a11y/useAnchorContent: aria-label provides accessible label */}
									<a
										href="https://github.com/bbennett7/adq"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="GitHub"
										className="site-footer-icon-link"
									>
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill="currentColor"
											aria-hidden="true"
										>
											<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
										</svg>
									</a>
									{/* biome-ignore lint/a11y/useAnchorContent: aria-label provides accessible label */}
									<a
										href="https://linkedin.com/in/bryncbennett"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="LinkedIn"
										className="site-footer-icon-link"
									>
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill="currentColor"
											aria-hidden="true"
										>
											<path d="M14.78 0H1.18C.53 0 0 .52 0 1.16v13.68C0 15.48.53 16 1.18 16h13.6c.65 0 1.18-.52 1.18-1.16V1.16C15.96.52 15.43 0 14.78 0ZM4.74 13.63H2.36V6h2.38v7.63ZM3.55 4.96a1.38 1.38 0 1 1 0-2.76 1.38 1.38 0 0 1 0 2.76Zm10.08 8.67h-2.37V9.92c0-.88-.02-2.02-1.23-2.02-1.24 0-1.43.96-1.43 1.96v3.77H6.23V6H8.5v1.04h.03c.32-.6 1.09-1.23 2.24-1.23 2.4 0 2.85 1.58 2.85 3.63v4.19Z" />
										</svg>
									</a>
								</div>
							</div>
						</div>
					</footer>
				</PostHogProvider>
			</body>
		</html>
	);
}
