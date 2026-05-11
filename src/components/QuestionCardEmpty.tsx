type Props = {
	variant: 'empty' | 'error';
};

const COPY = {
	empty: {
		cap: 'No question today',
		q: 'Nothing yet.',
		a: 'Check back tomorrow — a new question drops every weekday.',
	},
	error: {
		cap: 'Something went wrong',
		q: 'We hit a snag.',
		a: 'The question couldn’t be loaded. Refresh to try again.',
	},
};

export function QuestionCardEmpty({ variant }: Props) {
	const { cap, q, a } = COPY[variant];
	return (
		<article className="card">
			<div className="card-cap">
				<span>{cap}</span>
			</div>
			<div className="card-side card-q-side">
				<span className="card-label">Question</span>
				<p className="card-q card-empty-text">{q}</p>
			</div>
			<div className="card-side card-a-side">
				<span className="card-label">Answer</span>
				<p className="card-a card-empty-text">{a}</p>
			</div>
		</article>
	);
}
