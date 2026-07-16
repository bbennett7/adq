import {
	type FieldNoteRepository,
	fieldNoteRepository,
} from '@/lib/repositories/field-note.repository';
import type { PublishedFieldNote } from '@/lib/schemas';

export class FieldNoteService {
	constructor(
		private readonly repo: FieldNoteRepository = fieldNoteRepository,
	) {}

	async getPublishedNotes(): Promise<PublishedFieldNote[]> {
		return this.repo.getPublishedNotes();
	}

	async getNote(slug: string): Promise<PublishedFieldNote | null> {
		return this.repo.getNote(slug);
	}
}

export const fieldNoteService = new FieldNoteService();
