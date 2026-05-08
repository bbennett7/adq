export const revalidate = 3600;

import { QuestionList } from '@/components/QuestionList';
import { ARCHIVE_PAGE_SIZE } from '@/lib/config';
import { getRecentQuestions } from '@/lib/data';

export default async function ArchivePage() {
	const { questions, nextCursor } = await getRecentQuestions({
		limit: ARCHIVE_PAGE_SIZE,
	});

	return (
		<div className="archive">
			<div className="archive-head">
				<h1 className="archive-title">Question Archive</h1>
			</div>
			<QuestionList
				initial={questions}
				initialCursor={nextCursor}
				pageSize={ARCHIVE_PAGE_SIZE}
			/>
		</div>
	);
}
