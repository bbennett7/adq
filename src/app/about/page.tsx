import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'About — askdumbquestions.ai',
	description:
		'A daily AI Q&A publication. One foundational question, one honest answer, every weekday.',
};

export default function AboutPage() {
	return (
		<div className="about-page">
			<section className="about-section">
				<div className="about-section-label">
					<h2 className="about-section-head">The site</h2>
				</div>
				<div className="about-section-content">
					<div className="about-prose">
						<p>
							Every weekday, one foundational AI question gets a real answer
							here. Not a thinkpiece. Not a hot take. Just an honest attempt to
							answer the kind of question you're slightly embarrassed to admit
							you don't know — because everyone seems to assume you do.
						</p>
						<p>
							The questions are things like:{' '}
							<em>
								When does fine-tuning actually beat prompt engineering? What
								does "context window" really mean for retrieval? Why does
								temperature matter, and what does zero temperature even do?
							</em>{' '}
							Foundational questions. Definitional questions. The kind that
							expose exactly how much is still being figured out by everyone,
							including the people building these systems.
						</p>
						<p>
							A daily agent surfaces candidates from the AI news cycle — things
							that are timely, contested, or quietly assumed. I pick one,
							sometimes edit the framing, and publish. Each answer links out to
							the best further reading I found.
						</p>
						<p>
							The name is intentional. The dumb questions are the important
							ones.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
