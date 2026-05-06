'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fetchQuestions } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { Question } from '@/lib/schemas';
import { Button } from './Button';

export function QuestionList({
	initial,
	initialCursor,
}: {
	initial: Question[];
	initialCursor: number | null;
}) {
	const [questions, setQuestions] = useState(initial);
	const [cursor, setCursor] = useState(initialCursor);
	const [loading, setLoading] = useState(false);

	async function loadMore() {
		if (cursor === null) return;
		setLoading(true);
		try {
			const page = await fetchQuestions({ limit: 25, cursor });
			setQuestions((prev) => [...prev, ...page.questions]);
			setCursor(page.nextCursor);
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
