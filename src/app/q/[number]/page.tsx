import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
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
	const { number } = await params;
	const n = parseQuestionNumber(number);
	if (!n) return {};

	const question = await questionService.getQuestion(n);
	if (!question) return {};
	return { title: question.questionPt, description: question.questionPt };
}

async function QuestionContent({
	params,
}: {
	params: Promise<{ number: string }>;
}) {
	await connection();
	const { number } = await params;
	const n = parseQuestionNumber(number);
	if (!n) notFound();

	const question = await questionService.getQuestion(n);
	if (!question) notFound();

	const { prev, next } = await questionService.getAdjacentQuestions(n);

	return (
		<>
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
		</>
	);
}

export default function QuestionPage({ params }: Params) {
	return (
		<div className="question-page">
			<div className="question-page-back">
				<Link href={routes.archive} className="back-link">
					← All questions
				</Link>
			</div>
			<Suspense>
				<QuestionContent params={params} />
			</Suspense>
		</div>
	);
}
