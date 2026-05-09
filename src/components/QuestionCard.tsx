import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import type { PublishedQuestion } from '@/lib/schemas';

const REHYPE_PLUGINS = [rehypeSanitize];
const QUESTION_COMPONENTS: Components = {
	p: ({ children }) => <h1>{children}</h1>,
};

export function QuestionCard({ data }: { data: PublishedQuestion }) {
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
			</div>
			<div className="feature-body">
				<div className="feature-q">
					<span className="label">Question</span>
					<ReactMarkdown
						rehypePlugins={REHYPE_PLUGINS}
						components={QUESTION_COMPONENTS}
					>
						{data.questionMd}
					</ReactMarkdown>
				</div>
				<div className="feature-a">
					<span className="label">Answer</span>
					<ReactMarkdown rehypePlugins={REHYPE_PLUGINS}>
						{data.answerMd}
					</ReactMarkdown>
				</div>
			</div>
		</section>
	);
}
