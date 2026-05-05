import type { Metadata } from 'next';
import {
	DM_Mono,
	Inter_Tight,
	Libre_Franklin,
	Newsreader,
} from 'next/font/google';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const libreFranklin = Libre_Franklin({
	variable: '--font-libre-franklin',
	subsets: ['latin'],
	weight: ['300', '400', '700'],
});

const newsreader = Newsreader({
	variable: '--font-newsreader',
	subsets: ['latin'],
	weight: ['400', '500'],
	style: ['normal', 'italic'],
});

const interTight = Inter_Tight({
	variable: '--font-inter-tight',
	subsets: ['latin'],
	weight: ['400', '500', '600'],
	style: ['normal', 'italic'],
});

const dmMono = DM_Mono({
	variable: '--font-dm-mono',
	subsets: ['latin'],
	weight: ['400', '500'],
});

export const metadata: Metadata = {
	title: 'askdumbquestions.ai',
	description: 'One question. One answer. Every weekday.',
};

const themeScript = `(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;})();`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${libreFranklin.variable} ${newsreader.variable} ${interTight.variable} ${dmMono.variable}`}
			suppressHydrationWarning
		>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: FOUC-prevention script must run before paint */}
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body className="flex flex-col min-h-full">
				<header className="site-header">
					<div className="site-header-inner wrap">
						<div className="site-header-counter">
							{/* TODO: wire to live count query when DB is connected */}
							<b>142</b> answered &nbsp;·&nbsp; <span className="inf">∞</span>{' '}
							remaining
						</div>
						<Link href="/" className="wordmark">
							<span className="wordmark-pre">ask</span>
							<span className="wordmark-core">dumbquestions</span>
							<span className="wordmark-tld">.ai</span>
						</Link>
						<nav className="site-header-nav">
							<Link href="/archive">Questions</Link>
							<Link href="/notes">Field Notes</Link>
							<Link href="/resources">Resources</Link>
							<Link href="/about">About</Link>
						</nav>
					</div>
				</header>

				<main className="wrap flex-1">{children}</main>

				<footer className="site-footer">
					<div className="wrap site-footer-inner">
						<div>
							<Link href="/" className="site-footer-brand wordmark">
								<span className="wordmark-pre">ask</span>
								<span className="wordmark-core">dumbquestions</span>
								<span className="wordmark-tld">.ai</span>
							</Link>
							<div className="site-footer-tagline">
								One question · One answer · Every weekday
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
								<ThemeToggle />
							</div>
						</div>
					</div>
				</footer>
			</body>
		</html>
	);
}
