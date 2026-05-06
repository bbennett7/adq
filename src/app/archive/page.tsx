import { QuestionList } from '@/components/QuestionList';
import { getRecentQuestions } from '@/lib/data';

export default async function ArchivePage() {
	const { questions, nextCursor } = await getRecentQuestions({ limit: 25 });

	return (
		<div className="archive">
			<div className="archive-head">
				<h1 className="archive-title">All questions</h1>
			</div>
			<QuestionList initial={questions} initialCursor={nextCursor} />
		</div>
	);
}
