import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import type { PublishedQuestion } from '@/lib/schemas';

const REHYPE_PLUGINS = [rehypeSanitize];

const QUESTION_COMPONENTS: Components = {
	p: ({ children }) => <p className="card-q">{children}</p>,
	em: ({ children }) => <span className="gw">{children}</span>,
};

const ANSWER_COMPONENTS: Components = {
	p: ({ children }) => <p className="card-a">{children}</p>,
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
		<article className="card">
			<div className="card-cap">
				<span>{published}</span>
				<span>no. {num}</span>
			</div>
			<div className="card-side card-q-side">
				<span className="card-label">Question</span>
				<ReactMarkdown
					rehypePlugins={REHYPE_PLUGINS}
					components={QUESTION_COMPONENTS}
				>
					{data.questionMd}
				</ReactMarkdown>
			</div>
			<div className="card-side card-a-side">
				<span className="card-label">Answer</span>
				<ReactMarkdown
					rehypePlugins={REHYPE_PLUGINS}
					components={ANSWER_COMPONENTS}
				>
					{data.answerMd}
				</ReactMarkdown>
			</div>
		</article>
	);
}
