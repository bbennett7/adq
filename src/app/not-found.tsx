import Link from 'next/link';

export default function NotFound() {
	return (
		<div className="not-found">
			<div className="card">
				<div className="card-cap">
					<span>Page not found</span>
					<span>Error 404</span>
				</div>
				<div className="card-side card-q-side">
					<div className="card-label">The question</div>
					<h1 className="card-q">Where am I?</h1>
				</div>
				<div className="card-side card-a-side">
					<div className="card-label">The answer</div>
					<div className="card-a">
						<p>You found a page that doesn&rsquo;t exist.</p>
					</div>
					<div className="not-found-actions">
						<Link href="/" className="btn btn-primary">
							Today&rsquo;s question
						</Link>
						<Link href="/archive" className="btn btn-ghost">
							Browse the archive &rarr;
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
