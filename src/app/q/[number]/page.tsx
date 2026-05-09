import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuestionCard } from '@/components/QuestionCard';
import { ResourceLinks } from '@/components/ResourceLinks';
import { routes } from '@/lib/routes';
import { questionService } from '@/lib/services/question.service';

type Params = { params: Promise<{ number: string }> };

function parseQuestionNumber(raw: string): number | null {
	const n = parseInt(raw, 10);
	return Number.isNaN(n) || n < 1 || String(n) !== raw ? null : n;
}

export async function generateMetadata({ params }: Params) {
	'use cache';
	cacheLife('days');

	const { number } = await params;
	const n = parseQuestionNumber(number);
	if (!n) return {};

	const question = await questionService.getQuestion(n);
	if (!question) return {};
	return { title: question.questionPt, description: question.questionPt };
}

export default async function QuestionPage({ params }: Params) {
	'use cache';
	cacheLife('days');

	const { number } = await params;
	const n = parseQuestionNumber(number);

	if (!n) notFound();

	const question = await questionService.getQuestion(n);
	if (!question) notFound();

	const { prev, next } = await questionService.getAdjacentQuestions(n);

	return (
		<div className="question-page">
			<div className="question-page-back">
				<Link href={routes.archive} className="back-link">
					← All questions
				</Link>
			</div>
			<QuestionCard data={question} />
			{question.resources && <ResourceLinks links={question.resources} />}
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
