import Link from 'next/link';
import { routes } from '@/lib/routes';
import type { Question } from '@/lib/schemas';

function isYesterdayUtc(dateStr: string): boolean {
	const now = new Date();
	const yesterday = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
	);
	const d = new Date(dateStr);
	return (
		d.getUTCFullYear() === yesterday.getUTCFullYear() &&
		d.getUTCMonth() === yesterday.getUTCMonth() &&
		d.getUTCDate() === yesterday.getUTCDate()
	);
}

export function RecentQuestions({ items }: { items: Question[] }) {
	if (!items.length) return null;

	const [first, ...rest] = items;
	const firstLabel = isYesterdayUtc(first.publishedAt)
		? 'Yesterday'
		: new Date(first.publishedAt).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				timeZone: 'UTC',
			});

	return (
		<>
			<div className="featured-recent">
				<div className="day">{firstLabel}</div>
				<h3>{first.questionPt}</h3>
			</div>

			<ul className="qlist">
				{rest.map((item) => (
					<li key={item.id}>
						<span className="date">
							{new Date(item.publishedAt).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								timeZone: 'UTC',
							})}
						</span>
						<Link href={routes.question(item.number)}>{item.questionPt}</Link>
					</li>
				))}
			</ul>
		</>
	);
}
