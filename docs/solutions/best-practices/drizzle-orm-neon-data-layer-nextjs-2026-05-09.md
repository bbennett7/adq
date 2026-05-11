---
title: Drizzle ORM + Neon Data Layer — Repository/Service Pattern and Centralized Error Handling in Next.js 16
date: 2026-05-09
category: best-practices
module: data-layer
problem_type: best_practice
component: database
applies_when:
  - Adding PostgreSQL (Neon) to a Next.js 16 App Router project via Drizzle ORM
  - Using pgvector embeddings alongside relational display data
  - Multiple RSC functions (generateMetadata and the page component) share the same data-fetching logic
  - A project has more than two or three API route handlers that need consistent error responses
tags: [drizzle-orm, neon-postgresql, pgvector, nextjs-16, app-router, repository-pattern, service-layer, react-cache, error-handling, use-cache, cacheComponents]
related_docs:
  - docs/solutions/integration-issues/nextjs-16-app-router-patterns.md
---

## Context

The askdumbquestions.ai project (Next.js 16 App Router, Vercel, Neon PostgreSQL with pgvector) needed its first database layer. The initial implementation used `@neondatabase/serverless`'s tagged template `sql` directly with raw SQL strings and `as DbRow` casts to coerce results into typed objects — bypassing Zod entirely, so corrupt DB data could reach the app undetected. (session history)

Three architectural problems needed solving together:

1. **Raw SQL is unsafe and verbose** — manual `Record<string, unknown>` casting, hand-rolled snake_case→camelCase, JSON aggregation SQL for relations.
2. **No separation between DB access and page/route logic** — pages accumulate raw query code; impossible to deduplicate calls between `generateMetadata` and the page component.
3. **Per-route try/catch blocks** — every route handler duplicates error-catching and response-shaping logic.

The solution introduces four layers in `src/lib/`: schema (Drizzle), db client, repository (raw Drizzle queries), service (React `cache()` wrappers), with pages and routes acting as the controller layer.

---

## Guidance

### 1. Drizzle schema with pgvector (`src/lib/schema.ts`)

Drizzle has no built-in `vector` type. Use `customType` to define one. Use `mode: 'string'` on all `timestamp` columns when targeting the Neon HTTP driver — the driver returns ISO strings, not `Date` objects, which aligns directly with `z.iso.datetime()` in Zod validation without any conversion step.

```ts
import { relations } from 'drizzle-orm';
import { customType, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) { return `vector(${config?.dimensions ?? 1536})`; },
  fromDriver(value: string): number[] { return value.slice(1, -1).split(',').map(Number); },
  toDriver(value: number[]): string { return `[${value.join(',')}]`; },
});

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: integer('number').unique(),
  questionMd: text('question_md').notNull(),
  answerMd: text('answer_md').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),   // null = draft
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),        // soft delete
  embedding: vector('embedding', { dimensions: 1536 }),
});
```

**Why `publishedAt` is nullable**: questions exist as drafts (`publishedAt IS NULL`). The display layer always filters `isNotNull(q.publishedAt)` — a `PublishedQuestion` type narrows the base schema to non-nullable `publishedAt` for all published-content queries. (session history)

**Why resources are a normalized join table**: resources (URLs, papers, etc.) appear across multiple questions. Normalizing into a `resources` table with `UNIQUE(url)` means each resource is embedded once by pgvector, not once per question occurrence. (session history)

### 2. DB client (`src/lib/db.ts`)

Pass the full schema object to `drizzle()` so relational queries are available via `db.query.*`.

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL env var is required');

export const db = drizzle(neon(url), { schema });
```

### 3. Repository class (`src/lib/repositories/question.repository.ts`)

The repository owns all Drizzle query logic. Key decisions:

- **Exclude `embedding` columns** from all display queries with `columns: { embedding: false }` — avoids transferring ~11 KB of unused vector data per row.
- **Use query-scoped column alias** (`q.publishedAt`) in `where` callbacks, not the imported table reference. This is more idiomatic and avoids adding an unnecessary import.
- **`published_at <= now()` at query time** — PostgreSQL partial index predicates require immutable expressions, and `now()` is not immutable, so this filter cannot be pushed into an index. It lives in the `where` callback: `sql\`${q.publishedAt} <= now()\``.
- **Single Zod validation point** — a private static `toPublishedQuestion()` mapper runs `PublishedQuestionSchema.parse()` on every row, so validation happens at the DB boundary and never in page code.
- **Singleton export** — `export const questionRepository = new QuestionRepository()` provides a dependency injection surface for testing without requiring a DI container.

```ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { PublishedQuestionSchema } from '@/lib/schemas';

const questionColumns = { embedding: false } as const;
const resourceColumns = { embedding: false } as const;

export class QuestionRepository {
  private static toPublishedQuestion(row: QuestionRow): PublishedQuestion {
    return PublishedQuestionSchema.parse({
      ...row,
      resources: row.questionResources.map(({ resource }) => ({
        ...resource,
        author: resource.author ?? undefined,
      })),
    });
  }

  async getQuestion(number: number): Promise<PublishedQuestion | null> {
    const row = await db.query.questions.findFirst({
      columns: questionColumns,
      where: (q, { and, eq, isNotNull, isNull }) =>
        and(
          eq(q.number, number),
          isNotNull(q.publishedAt),
          sql`${q.publishedAt} <= now()`,
          isNull(q.deletedAt),
        ),
      with: {
        questionResources: {
          orderBy: (qr, { asc }) => asc(qr.sortOrder),
          with: { resource: { columns: resourceColumns } },
        },
      },
    });
    return row ? QuestionRepository.toPublishedQuestion(row) : null;
  }
}

export const questionRepository = new QuestionRepository();
```

**Pitfall — inlining the `with` config**: Extracting a shared `with` object as a module-level constant fails because Drizzle's `orderBy` callbacks inside `with` use column types that differ between `$inferSelect` (module scope) and the query-scoped column objects. Inline the `with` config in each query method.

### 4. Service class with React `cache()` (`src/lib/services/question.service.ts`)

The service wraps each repository method in React's `cache()`. This deduplicates calls within a single render cycle — `generateMetadata` and the page component can both call `getQuestion(n)` and only one DB round-trip occurs. Method names must match the repository methods exactly (e.g., both `getRecentQuestions`) unless the service is genuinely orchestrating across multiple repos.

```ts
import { cache } from 'react';
import { questionRepository } from '@/lib/repositories/question.repository';

export class QuestionService {
  constructor(private readonly repo = questionRepository) {}

  getQuestion = cache(
    async (number: number): Promise<PublishedQuestion | null> =>
      this.repo.getQuestion(number),
  );

  getRecentQuestions = cache(
    async (limit: number, cursor?: number): Promise<PublishedQuestionsPage> =>
      this.repo.getRecentQuestions(limit, cursor),
  );
}

export const questionService = new QuestionService();
```

### 5. Centralized error handling (`src/lib/api-error.ts` + `src/lib/handler.ts`)

Define a typed error hierarchy so route handlers throw errors rather than manually shaping responses. A single HOF wraps every route handler. The generic `Args extends unknown[]` enables use with dynamic route params (Next.js passes `{ params }` as the second argument to route handlers).

```ts
// src/lib/api-error.ts
export abstract class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
export class UnauthorizedError extends AppError {
  constructor() { super(401, 'Unauthorized'); this.name = 'UnauthorizedError'; }
}
export class BadRequestError extends AppError {
  constructor(message: string, cause?: unknown) { super(400, message, cause); this.name = 'BadRequestError'; }
}
export class NotFoundError extends AppError {
  constructor(message?: string, cause?: unknown) {
    super(404, message ? `Not Found: ${message}` : 'Not Found', cause);
    this.name = 'NotFoundError';
  }
}
```

```ts
// src/lib/handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export function withErrorHandling<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<NextResponse>,
): (request: Request, ...args: Args) => Promise<NextResponse> {
  return async (request, ...args) => {
    const ctx = { method: request.method, path: new URL(request.url).pathname };
    try {
      return await handler(request, ...args);
    } catch (err) {
      if (err instanceof AppError) {
        logger.error(
          { ...ctx, status: err.status, type: err.name, cause: err.cause instanceof Error ? err.cause : undefined },
          err.message,
        );
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        logger.error({ ...ctx, type: 'ZodError', issues: err.issues }, 'Invalid request');
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }
      logger.error(
        { ...ctx, type: err instanceof Error ? err.constructor.name : 'UnknownError', err: err instanceof Error ? err : { message: String(err) } },
        'Internal server error',
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
```

Use `ZodSchema.parse()` (throws `ZodError`) rather than `safeParse` + manual check — the handler boundary already catches `ZodError` and returns a 400.

**Note on Zod v4**: `ZodError` cannot be caught via prototype augmentation. `parse()` throws it natively and `withErrorHandling` catches it at the handler boundary. Avoid adding custom methods to Zod's base class. (session history)

### 6. `cacheComponents: true` in Next.js 16

The `'use cache'` directive requires `cacheComponents: true` in `next.config.ts`. This replaces `experimental.dynamicIO` from Next.js 15 — they are **not** the same API. Using `experimental.dynamicIO` on Next.js 16 will silently have no effect.

```ts
// next.config.ts
const config: NextConfig = {
  cacheComponents: true,
};
```

Place the `'use cache'` directive **inside the function body** (not at the top of the file), combined with `cacheLife()`. For broader `'use cache'` and `cacheLife` patterns, see `docs/solutions/integration-issues/nextjs-16-app-router-patterns.md` §3.

### 7. Environment variable validation

**Do not** use `vercel.json` `env` declarations with `"required": true` — this was a Vercel beta API that was never productionized and has no effect. Vercel ignores it silently.

The correct approach is runtime validation at server startup. The `src/lib/db.ts` module already does this for `DATABASE_URL`:

```ts
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL env var is required');
```

For `REVALIDATION_SECRET`, the revalidate route handler validates presence and returns 401 if absent, which is the correct behavior.

Document all required env vars in `.env.local.example` — that file is the source of truth for what variables the app needs.

---

## Why This Matters

- **Type safety end-to-end**: Drizzle infers column types from the schema; the repository's `toPublishedQuestion()` validates at the DB boundary with Zod — no `any` or manual casts flow into page code.
- **No wasted bandwidth**: Excluding `embedding` columns eliminates ~11 KB per row on every display query.
- **Consistent error responses**: `withErrorHandling` gives every route the same error shape and logging behavior. Adding a new route handler requires zero try/catch boilerplate.
- **Render deduplication**: Without React `cache()` in the service layer, `generateMetadata` and the page component each fire their own DB query — two round-trips for every page render.
- **Soft deletes everywhere**: `deletedAt` is part of every published-content query filter. Records are never lost.
- **Testability**: Repository and service classes use constructor injection. Tests pass a mock repository to `QuestionService` without patching module imports.

---

## When to Apply

- Any Next.js App Router project connecting to PostgreSQL via Drizzle ORM (Neon or otherwise).
- Projects where pgvector embeddings are stored alongside display data — always exclude embedding columns from non-similarity queries.
- Projects where page components and metadata functions share the same data-fetching logic — always wrap in React `cache()` at the service layer.
- Projects with more than two or three API route handlers — centralize error handling from the start.
- Any content with a publication date — use `published_at <= now()` at query time, not as a partial index predicate.

---

## Examples

### Before: raw SQL in a page (anti-pattern)

```ts
// src/app/q/[number]/page.tsx — before (session history)
const rows = await sql`
  SELECT q.*, json_agg(r.*) as resources
  FROM questions q
  LEFT JOIN question_resources qr ON qr.question_id = q.id
  LEFT JOIN resources r ON r.id = qr.resource_id
  WHERE q.number = ${number}
    AND q.published_at IS NOT NULL
    AND q.published_at <= now()
    AND q.deleted_at IS NULL
  GROUP BY q.id
`;
const question = rows[0] as Record<string, unknown>; // unsafe cast — Zod never runs
```

### After: service layer (correct pattern)

```ts
// src/app/q/[number]/page.tsx — after
export default async function QuestionPage({ params }: Params) {
  'use cache';
  cacheLife('days');

  const { number } = await params;
  const n = parseInt(number, 10);
  if (Number.isNaN(n) || n < 1) notFound();

  const question = await questionService.getQuestion(n); // typed PublishedQuestion | null
  if (!question) notFound();

  const { prev, next } = await questionService.getAdjacentQuestions(n);
  // generateMetadata also calls questionService.getQuestion(n) — React cache() ensures one DB hit
}
```

### Before: per-route try/catch (anti-pattern)

```ts
export const GET = async (request: Request) => {
  try {
    const data = await questionService.getRecentQuestions(10);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

### After: `withErrorHandling` HOF (correct pattern)

```ts
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const query = QuestionsQuerySchema.parse({
    limit: searchParams.get('limit') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
  });
  const page = await questionService.getRecentQuestions(query.limit, query.cursor);
  return NextResponse.json(page);
});
```

---

## Referenced Files

- `src/lib/schema.ts` — Drizzle table definitions and relations
- `src/lib/db.ts` — Drizzle + Neon HTTP client singleton
- `src/lib/repositories/question.repository.ts` — repository implementation
- `src/lib/services/question.service.ts` — service with React `cache()` wrappers
- `src/lib/api-error.ts` — `AppError` hierarchy
- `src/lib/handler.ts` — `withErrorHandling` HOF
- `src/lib/request.ts` — `parseJsonBody` helper
- `migrations/` — SQL migration files (source of truth for DB schema)
- `next.config.ts` — `cacheComponents: true`
