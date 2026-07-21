import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { routes } from '@/lib/routes';
import type { PublishedFieldNote } from '@/lib/schemas';
import { fieldNoteService } from '@/lib/services/field-note.service';

export const metadata = {
	title: 'Field Notes',
	description: 'Longer essays from building AI systems in production.',
};

function noteDate(iso: string): string {
	return new Date(iso)
		.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC',
		})
		.toLowerCase();
}

function FeaturedNote({ note }: { note: PublishedFieldNote }) {
	return (
		<Link href={routes.note(note.slug)} className="note-featured">
			<div className="day">
				{noteDate(note.publishedAt)}
				{note.topic && <span className="note-topic">{note.topic}</span>}
			</div>
			<h3>{note.title}</h3>
			{note.bodyPt && (
				<p className="note-featured-excerpt">
					{note.bodyPt.length > 180
						? `${note.bodyPt.slice(0, 180).trimEnd()}…`
						: note.bodyPt}
				</p>
			)}
		</Link>
	);
}

async function NotesContent({
	searchParams,
}: {
	searchParams: Promise<{ topic?: string }>;
}) {
	await connection();
	const { topic } = await searchParams;
	const notes = await fieldNoteService.getPublishedNotes();

	if (!notes.length) {
		return <p className="notes-empty">Nothing yet — first note coming soon.</p>;
	}

	const topics = [
		...new Set(notes.map((n) => n.topic).filter((t): t is string => !!t)),
	].sort();
	const active = topic && topics.includes(topic) ? topic : null;
	const visible = active ? notes.filter((n) => n.topic === active) : notes;
	const featured = visible.filter((n) => n.featured);
	const rest = visible.filter((n) => !n.featured);

	return (
		<>
			{topics.length > 0 && (
				<nav className="topic-filter" aria-label="Filter by topic">
					<Link href={routes.notes} className={active ? '' : 'active'}>
						all
					</Link>
					{topics.map((t) => (
						<Link
							key={t}
							href={`${routes.notes}?topic=${encodeURIComponent(t)}`}
							className={active === t ? 'active' : ''}
						>
							{t}
						</Link>
					))}
				</nav>
			)}

			{featured.map((note) => (
				<FeaturedNote key={note.id} note={note} />
			))}

			{rest.length > 0 && (
				<ul className="nlist">
					{rest.map((note) => (
						<li key={note.id}>
							<span className="date">{noteDate(note.publishedAt)}</span>
							<Link href={routes.note(note.slug)}>{note.title}</Link>
							{note.topic && <span className="note-topic">{note.topic}</span>}
						</li>
					))}
				</ul>
			)}
		</>
	);
}

export default function NotesPage({
	searchParams,
}: {
	searchParams: Promise<{ topic?: string }>;
}) {
	return (
		<div className="archive">
			<div className="archive-head">
				<h1 className="archive-title">Field Notes</h1>
			</div>
			<p className="notes-intro">
				Longer essays from building AI systems in production.
			</p>
			<Suspense>
				<NotesContent searchParams={searchParams} />
			</Suspense>
		</div>
	);
}
