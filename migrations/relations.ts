import { relations } from 'drizzle-orm/relations';
import {
	candidates,
	pipelineRuns,
	questionResources,
	questions,
	resources,
} from './schema';

export const candidatesRelations = relations(candidates, ({ one }) => ({
	pipelineRun: one(pipelineRuns, {
		fields: [candidates.runId],
		references: [pipelineRuns.id],
	}),
}));

export const pipelineRunsRelations = relations(pipelineRuns, ({ many }) => ({
	candidates: many(candidates),
}));

export const questionResourcesRelations = relations(
	questionResources,
	({ one }) => ({
		question: one(questions, {
			fields: [questionResources.questionId],
			references: [questions.id],
		}),
		resource: one(resources, {
			fields: [questionResources.resourceId],
			references: [resources.id],
		}),
	}),
);

export const questionsRelations = relations(questions, ({ many }) => ({
	questionResources: many(questionResources),
}));

export const resourcesRelations = relations(resources, ({ many }) => ({
	questionResources: many(questionResources),
}));
