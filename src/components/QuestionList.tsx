'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { fetchQuestions } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { PublishedQuestion } from '@/lib/schemas';

export function QuestionList({
	initial,
	initialCursor,
	pageSize,
}: {
	initial: PublishedQuestion[];
	initialCursor: number | null;
	pageSize: number;
}) {
	const [questions, setQuestions] = useState(initial);
	const [cursor, setCursor] = useState(initialCursor);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function loadMore() {
		if (cursor === null) return;
		setLoading(true);
		setError(null);
		try {
			const page = await fetchQuestions({ limit: pageSize, cursor });
			setQuestions((prev) => [...prev, ...page.questions]);
			setCursor(page.nextCursor);
		} catch {
			setError('Failed to load more questions. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<ul className="qlist">
				{questions.map((q) => (
					<li key={q.id}>
						<span className="date">
							{new Date(q.publishedAt).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								timeZone: 'UTC',
							})}
						</span>
						<Link href={routes.question(q.number)}>{q.questionPt}</Link>
					</li>
				))}
			</ul>
			{error && <p className="load-more-error">{error}</p>}
			{cursor !== null && (
				<div className="load-more">
					<Button onClick={loadMore} disabled={loading}>
						{loading ? 'Loading…' : 'Load more'}
					</Button>
				</div>
			)}
		</>
	);
}
