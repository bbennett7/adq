import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { EmailSignup } from '@/components/EmailSignup';
import { HomeSkeleton } from '@/components/HomeSkeleton';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionCardEmpty } from '@/components/QuestionCardEmpty';
import { RecentQuestions } from '@/components/RecentQuestions';
import { HOME_NOTES_PREVIEW_SIZE, HOME_PREVIEW_SIZE } from '@/lib/config';
import { routes } from '@/lib/routes';
import { fieldNoteService } from '@/lib/services/field-note.service';
import { questionService } from '@/lib/services/question.service';

async function HomeContent() {
	await connection();
	const [{ questions }, notes] = await Promise.all([
		questionService.getRecentQuestions(HOME_PREVIEW_SIZE + 1),
		fieldNoteService.getPublishedNotes(),
	]);
	const [today, ...recent] = questions;
	const recentNotes = notes.slice(0, HOME_NOTES_PREVIEW_SIZE);

	return (
		<>
			{today ? (
				<QuestionCard data={today} />
			) : (
				<QuestionCardEmpty variant="empty" />
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
					{recentNotes.length ? (
						<ul className="nlist">
							{recentNotes.map((note) => (
								<li key={note.id}>
									<span className="date">
										{new Date(note.publishedAt)
											.toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												timeZone: 'UTC',
											})
											.toLowerCase()}
									</span>
									<Link href={routes.note(note.slug)}>{note.title}</Link>
									{note.topic && (
										<span className="note-topic">{note.topic}</span>
									)}
								</li>
							))}
						</ul>
					) : (
						<p className="notes-empty">Nothing yet — first note coming soon.</p>
					)}
				</div>
			</div>
		</>
	);
}

export default function Home() {
	return (
		<>
			<Suspense fallback={<HomeSkeleton />}>
				<HomeContent />
			</Suspense>
			<EmailSignup />
		</>
	);
}
