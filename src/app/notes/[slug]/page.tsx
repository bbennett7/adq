import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { excerpt } from '@/lib/excerpt';
import { routes } from '@/lib/routes';
import { fieldNoteService } from '@/lib/services/field-note.service';

type Params = { params: Promise<{ slug: string }> };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function generateMetadata({ params }: Params) {
	const { slug } = await params;
	if (!SLUG_PATTERN.test(slug)) return {};

	const note = await fieldNoteService.getNote(slug);
	if (!note) return {};
	const description = note.bodyPt ? excerpt(note.bodyPt) : undefined;
	return { title: note.title, description };
}

async function NoteContent({ params }: Params) {
	await connection();
	const { slug } = await params;
	if (!SLUG_PATTERN.test(slug)) notFound();

	const note = await fieldNoteService.getNote(slug);
	if (!note) notFound();

	const published = new Date(note.publishedAt).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	});

	return (
		<article className="note">
			<header className="note-head">
				<div className="note-meta">
					<span>{published}</span>
					{note.topic && <span className="note-topic">{note.topic}</span>}
				</div>
				<h1 className="note-title">{note.title}</h1>
			</header>
			<div className="note-body">
				<ReactMarkdown rehypePlugins={[rehypeSanitize]}>
					{note.bodyMd}
				</ReactMarkdown>
			</div>
		</article>
	);
}

export default function NotePage({ params }: Params) {
	return (
		<div className="question-page">
			<div className="question-page-back">
				<Link href={routes.notes} className="back-link">
					← All field notes
				</Link>
			</div>
			<Suspense>
				<NoteContent params={params} />
			</Suspense>
		</div>
	);
}
