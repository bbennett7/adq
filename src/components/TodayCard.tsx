import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { routes } from '@/lib/routes';
import type { Question } from '@/lib/schemas';

export function TodayCard({ data }: { data: Question }) {
	const num = String(data.number).padStart(3, '0');
	const published = new Date(data.publishedAt).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	});

	return (
		<section className="feature">
			<div className="feature-meta">
				<span>
					<b>{published}</b> &nbsp;·&nbsp; no. {num}
				</span>
				<span />
			</div>
			<div className="feature-body">
				<div className="feature-q">
					<span className="label">Question</span>
					<ReactMarkdown
						rehypePlugins={[rehypeSanitize]}
						components={{ p: ({ children }) => <h1>{children}</h1> }}
					>
						{data.questionMd}
					</ReactMarkdown>
				</div>
				<div className="feature-a">
					<span className="label">Answer</span>
					<ReactMarkdown rehypePlugins={[rehypeSanitize]}>
						{data.answerMd}
					</ReactMarkdown>
					<Link
						href={routes.furtherReading(data.number)}
						className="further-link"
					>
						Further reading →
					</Link>
				</div>
			</div>
		</section>
	);
}
