export function QuestionPageSkeleton() {
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
						<span className="skeleton-text" style={{ width: '80%' }} />
					</p>
				</div>
				<div className="card-side card-a-side">
					<span className="card-label">Answer</span>
					<p className="card-a">
						<span className="skeleton-text" style={{ width: '100%' }} />
						<span className="skeleton-text" style={{ width: '95%' }} />
						<span className="skeleton-text" style={{ width: '100%' }} />
						<span className="skeleton-text" style={{ width: '70%' }} />
					</p>
				</div>
			</article>

			<nav className="question-nav">
				<div>
					<div className="question-nav-item skeleton-block">
						<span className="question-nav-dir">
							<span className="skeleton-text" style={{ width: '72px' }} />
						</span>
						<span className="question-nav-title">
							<span className="skeleton-text" style={{ width: '180px' }} />
						</span>
					</div>
				</div>
				<div>
					<div className="question-nav-item question-nav-item--next skeleton-block">
						<span className="question-nav-dir">
							<span className="skeleton-text" style={{ width: '52px' }} />
						</span>
						<span className="question-nav-title">
							<span className="skeleton-text" style={{ width: '160px' }} />
						</span>
					</div>
				</div>
			</nav>
		</>
	);
}
