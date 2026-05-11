import { connection } from 'next/server';
import { Suspense } from 'react';
import { QuestionList } from '@/components/QuestionList';
import { ARCHIVE_PAGE_SIZE } from '@/lib/config';
import { questionService } from '@/lib/services/question.service';

async function ArchiveContent() {
	await connection();
	const { questions, nextCursor } =
		await questionService.getRecentQuestions(ARCHIVE_PAGE_SIZE);
	return (
		<QuestionList
			initial={questions}
			initialCursor={nextCursor}
			pageSize={ARCHIVE_PAGE_SIZE}
		/>
	);
}

export default function ArchivePage() {
	return (
		<div className="archive">
			<div className="archive-head">
				<h1 className="archive-title">Question Archive</h1>
			</div>
			<Suspense>
				<ArchiveContent />
			</Suspense>
		</div>
	);
}
