import Link from 'next/link';
import { QuestionCard } from '@/components/QuestionCard';
import { RecentQuestions } from '@/components/RecentQuestions';
import { getLatestQuestion, getRecentQuestions } from '@/lib/data';

export default async function Home() {
	const [today, { questions }] = await Promise.all([
		getLatestQuestion(),
		getRecentQuestions({ limit: 8 }),
	]);

	return (
		<>
			<QuestionCard data={today} />

			<div className="columns">
				<div>
					<div className="col-head">
						<h2>Recent questions</h2>
						<Link href="/archive" className="more">
							All →
						</Link>
					</div>
					<RecentQuestions items={questions} />
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
