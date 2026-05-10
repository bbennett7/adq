import {
	type QuestionRepository,
	questionRepository,
} from '@/lib/repositories/question.repository';
import type { PublishedQuestion, PublishedQuestionsPage } from '@/lib/schemas';

export class QuestionService {
	constructor(private readonly repo: QuestionRepository = questionRepository) {}

	async getQuestion(number: number): Promise<PublishedQuestion | null> {
		return this.repo.getQuestion(number);
	}

	async getAdjacentQuestions(number: number): Promise<{
		prev: PublishedQuestion | null;
		next: PublishedQuestion | null;
	}> {
		return this.repo.getAdjacentQuestions(number);
	}

	async getRecentQuestions(
		limit: number,
		cursor?: number,
	): Promise<PublishedQuestionsPage> {
		return this.repo.getRecentQuestions(limit, cursor);
	}
}

export const questionService = new QuestionService();
