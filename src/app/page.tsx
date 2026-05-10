import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { QuestionCard } from '@/components/QuestionCard';
import { RecentQuestions } from '@/components/RecentQuestions';
import { HOME_PREVIEW_SIZE } from '@/lib/config';
import { questionService } from '@/lib/services/question.service';

async function HomeContent() {
	await connection();
	const { questions } = await questionService.getRecentQuestions(
		HOME_PREVIEW_SIZE + 1,
	);
	const [today, ...recent] = questions;

	return (
		<>
			{today ? (
				<QuestionCard data={today} />
			) : (
				<div className="feature feature--empty">
					<p>No question today — check back tomorrow.</p>
				</div>
			)}

			<div className="columns">
				<div>
					<div className="col-head">
						<h2>Recent questions</h2>
						<Link href="/archive" className="more">
							All →
						</Link>
					</div>
					<RecentQuestions items={recent} />
				</div>

				<div>
					<div className="col-head">
						<h2>Field notes</h2>
						<Link href="/notes" className="more">
							All →
						</Link>
					</div>
					<p className="notes-intro">
						Longer essays from building AI systems in production.
					</p>
					<p className="notes-empty">Nothing yet — first note coming soon.</p>
				</div>
			</div>
		</>
	);
}

export default function Home() {
	return (
		<Suspense>
			<HomeContent />
		</Suspense>
	);
}
