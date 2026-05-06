import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuestionCard } from '@/components/QuestionCard';
import { ResourceLinks } from '@/components/ResourceLinks';
import { getAdjacentQuestions, getQuestion } from '@/lib/data';
import { routes } from '@/lib/routes';

export default async function QuestionPage({
	params,
}: {
	params: Promise<{ number: string }>;
}) {
	const { number } = await params;
	const n = Number(number);

	if (!Number.isInteger(n) || n < 1) notFound();

	const question = await getQuestion(n);
	if (!question) notFound();

	const { prev, next } = await getAdjacentQuestions(n);

	return (
		<div className="question-page">
			<div className="question-page-back">
				<Link href={routes.archive} className="back-link">
					← All questions
				</Link>
			</div>
			<QuestionCard data={question} />
			{question.resources && question.resources.length > 0 && (
				<ResourceLinks links={question.resources} />
			)}
			{(prev || next) && (
				<nav className="question-nav">
					<div>
						{prev && (
							<Link
								href={routes.question(prev.number)}
								className="question-nav-item"
							>
								<span className="question-nav-dir">← Previous</span>
								<span className="question-nav-title">{prev.questionPt}</span>
							</Link>
						)}
					</div>
					<div>
						{next && (
							<Link
								href={routes.question(next.number)}
								className="question-nav-item question-nav-item--next"
							>
								<span className="question-nav-dir">Next →</span>
								<span className="question-nav-title">{next.questionPt}</span>
							</Link>
						)}
					</div>
				</nav>
			)}
		</div>
	);
}
