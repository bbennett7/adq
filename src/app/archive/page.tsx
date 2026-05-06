import { ARCHIVE_PAGE_SIZE, QuestionList } from '@/components/QuestionList';
import { getRecentQuestions } from '@/lib/data';

export default async function ArchivePage() {
	const { questions, nextCursor } = await getRecentQuestions({
		limit: ARCHIVE_PAGE_SIZE,
	});

	return (
		<div className="archive">
			<div className="archive-head">
				<h1 className="archive-title">All questions</h1>
			</div>
			<QuestionList initial={questions} initialCursor={nextCursor} />
		</div>
	);
}
