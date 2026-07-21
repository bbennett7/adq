export function HomeSkeleton() {
	return (
		<>
			<article className="card">
				<div className="card-cap">
					<span className="skeleton-text" style={{ width: '120px' }} />
					<span className="skeleton-text" style={{ width: '56px' }} />
				</div>
				<div className="card-side card-q-side">
					<span className="card-label">Question</span>
					<p className="card-q">
						<span className="skeleton-text" style={{ width: '100%' }} />
						<span className="skeleton-text" style={{ width: '75%' }} />
					</p>
				</div>
				<div className="card-side card-a-side">
					<span className="card-label">Answer</span>
					<p className="card-a">
						<span className="skeleton-text" style={{ width: '100%' }} />
						<span className="skeleton-text" style={{ width: '90%' }} />
						<span className="skeleton-text" style={{ width: '60%' }} />
					</p>
				</div>
			</article>

			<div className="columns">
				<div>
					<div className="col-head">
						<h2>Recent questions</h2>
					</div>
					<div className="featured-recent skeleton-block">
						<div className="day">
							<span className="skeleton-text" style={{ width: '80px' }} />
						</div>
						<h3>
							<span className="skeleton-text" style={{ width: '85%' }} />
						</h3>
					</div>
					<ul className="qlist">
						<li>
							<span className="date">
								<span className="skeleton-text" style={{ width: '40px' }} />
							</span>
							<span className="skeleton-text" style={{ width: '70%' }} />
						</li>
						<li>
							<span className="date">
								<span className="skeleton-text" style={{ width: '40px' }} />
							</span>
							<span className="skeleton-text" style={{ width: '70%' }} />
						</li>
						<li>
							<span className="date">
								<span className="skeleton-text" style={{ width: '40px' }} />
							</span>
							<span className="skeleton-text" style={{ width: '70%' }} />
						</li>
					</ul>
				</div>

				<div>
					<div className="col-head">
						<h2>Field notes</h2>
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
