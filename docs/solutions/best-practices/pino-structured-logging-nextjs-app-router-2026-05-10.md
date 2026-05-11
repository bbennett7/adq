---
title: Pino structured logging in Next.js 16 App Router — correct configuration and pitfalls
date: 2026-05-10
category: best-practices
module: logging
problem_type: best_practice
component: instrumentation
applies_when:
  - Adding pino structured logging to a Next.js 16 App Router project
  - Using pino with Vercel deployments (Preview and Production)
  - Logging errors that may contain database credentials (e.g. NeonDbError)
  - Registering a Next.js instrumentation hook (instrumentation.ts)
  - Any project that could gain edge runtime routes in future
tags: [pino, logging, next.js, vercel, edge-runtime, serializers, redact, instrumentation, security, typescript]
related_docs:
  - docs/solutions/best-practices/drizzle-orm-neon-data-layer-nextjs-2026-05-09.md
  - docs/solutions/integration-issues/nextjs-16-app-router-patterns.md
---

## Context

Adding pino to a Next.js 16 App Router project on Vercel involves several non-obvious pitfalls that cause either silent data loss in production logs, credential leakage to log sinks, or worker thread spawning on Vercel Preview cold starts. This documents the correct configuration and every gotcha encountered during code review of PR #6.

---

## Guidance

### 1. Dependencies

`pino` is a runtime dependency. `pino-pretty` is dev-only — it is conditionally loaded only in local development.

```json
{
  "dependencies": {
    "pino": "^10.3.1"
  },
  "devDependencies": {
    "pino-pretty": "^13.1.3"
  }
}
```

If `pnpm audit` surfaces vulnerabilities in transitive dependencies (e.g. `esbuild` via `drizzle-kit`, `postcss` via `next`) that upstream packages have not yet patched, pin them via `pnpm.overrides`:

```json
{
  "pnpm": {
    "overrides": {
      "esbuild": ">=0.25.0",
      "postcss": ">=8.5.10"
    }
  }
}
```

Use a lower-bounded range (`>=x.y.z`) rather than a pinned version so patch releases flow through without manual intervention.

### 2. Logger singleton (`src/lib/logger.ts`)

```ts
import pino from 'pino';
import type { LevelWithSilent } from 'pino';

export const logger = pino({
  level: (process.env.LOG_LEVEL ?? 'info') as LevelWithSilent,
  serializers: {
    err: pino.stdSerializers.err,
    cause: pino.stdSerializers.err,
  },
  redact: {
    paths: ['*.password', '*.secret', '*.token', '*.key', '*.authorization', '*.connectionString'],
    censor: '[REDACTED]',
  },
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname' },
    },
  }),
});
```

**Gotcha — register `pino.stdSerializers.err` for every key name you use to pass errors.**
`Error` properties (`message`, `stack`, `name`) are non-enumerable. Without an explicit serializer, pino serializes any `Error` instance as `{}` in production JSON output — silently, with no warning. Register the serializer for both `err` and `cause` since those are the keys used at call sites. The serializer must match the exact key name.

**Gotcha — guard pino-pretty with `=== 'development'`, not `!== 'production'`.**
Vercel Preview deployments may not set `NODE_ENV=production`. Using `!== 'production'` spawns a pino-pretty worker thread (30–80ms overhead) on every Preview cold start. `=== 'development'` restricts pretty-print to local dev only, where an interactive terminal is actually present.

**Gotcha — `cause` must be narrowed before passing to the logger.**
`AppError.cause` (and the built-in `Error.cause`) is typed `unknown`. The `cause` serializer only handles `Error` instances correctly. Always narrow at the call site:

```ts
cause: err.cause instanceof Error ? err.cause : undefined
```

**Gotcha — `LOG_LEVEL` must be documented and typed.**
Document `LOG_LEVEL` in `.env.local.example` with valid values. Cast the env var to pino's `LevelWithSilent` type to prevent a startup crash from an invalid value:

```
# .env.local.example
# Pino log level — trace | debug | info | warn | error | fatal | silent (default: info)
LOG_LEVEL=info
```

### 3. Next.js instrumentation hook (`src/instrumentation.ts`)

```ts
import type { Instrumentation } from 'next';
import { logger } from '@/lib/logger';

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const error = err as Error & { digest?: string };
  logger.error(
    {
      type: 'InstrumentationError',
      digest: error.digest,
      method: request.method,
      path: request.path,
      routerKind: context.routerKind,
      routeType: context.routeType,
      routePath: context.routePath,
    },
    error.message,
  );
};
```

**Gotcha — `err` is typed `unknown` in the installed types, not `{ digest: string } & Error`.**
The Next.js 16.2.2 docs describe `err` as `{ digest: string } & Error`, but the actual installed TypeScript types have `err: unknown`. Always trust the installed types over prose documentation — verify with `pnpm tsc --noEmit` or editor hover. Cast as `Error & { digest?: string }` with `digest` optional since it is only present on Next.js-generated errors.

**Gotcha — use `=== 'edge'` not `!== 'nodejs'` as the runtime guard.**
`NEXT_RUNTIME` is `undefined` in local development, not `'nodejs'`. Guarding with `!== 'nodejs'` silently skips all logging locally. `=== 'edge'` is the correct guard: it only exits in the V8 isolate edge runtime where `worker_threads` (required by pino) is unavailable. This matches the pattern shown in the Next.js 16.2.2 API reference for `onRequestError`.

**Gotcha — `register()` must be exported even if empty.**
The Next.js 16.2.2 instrumentation guide states: "You must export a register function that Next.js calls once when a new server instance is initiated." Omitting it causes `onRequestError` to be silently ignored. Export it as a no-op if you have no SDK initialization.

**Gotcha — `onRequestError` runs in the instrumentation context, not the route context.**
`onRequestError` fires for errors that escape route handlers entirely (RSC render errors, middleware panics). It is complementary to `withErrorHandling` in route handlers — not a replacement. Both paths must use a consistent log schema (same field names) so log drain queries work uniformly across both error sources. Include a `type` discriminator in the log object at both sites.

### 4. Error handler logging (`src/lib/handler.ts`)

Use a consistent schema across all catch branches. The `type` field is the primary discriminator for log drain queries.

```ts
const ctx = {
  method: request.method,
  path: new URL(request.url).pathname,
};

// AppError branch — use err.name (actual subclass name e.g. 'NotFoundError')
logger.error(
  { ...ctx, status: err.status, type: err.name, cause: err.cause instanceof Error ? err.cause : undefined },
  err.message,
);

// ZodError branch
logger.error(
  { ...ctx, type: 'ZodError', issues: err.issues },
  'Invalid request',
);

// Unknown/fallback branch — use constructor.name for known Error subclasses
logger.error(
  {
    ...ctx,
    type: err instanceof Error ? err.constructor.name : 'UnknownError',
    err: err instanceof Error ? err : { message: String(err) },
  },
  'Internal server error',
);
```

Using `err.constructor.name` in the unknown branch means a thrown `TypeError` logs `type: 'TypeError'`, not `type: 'UnknownError'`, making log drain queries more precise.

### 5. Environment variable validation

Do not use `vercel.json` `env.required` for deploy-time validation — it was a Vercel beta feature that was never productionized and is silently ignored. Validate required env vars at runtime in the application itself. The `src/lib/db.ts` pattern is correct:

```ts
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL env var is required');
```

For optional env vars with a controlled value set (like `LOG_LEVEL`), use a type cast to the expected union type and document valid values in `.env.local.example`.

---

## Gotcha Reference Table

| Gotcha | Wrong | Correct |
|---|---|---|
| `onRequestError` `err` type | Assume `Error & { digest: string }` from docs | Cast as `Error & { digest?: string }` — installed type is `unknown` |
| NEXT_RUNTIME guard | `!== 'nodejs'` | `=== 'edge'` — `NEXT_RUNTIME` is `undefined` in local dev |
| pino-pretty transport guard | `!== 'production'` | `=== 'development'` — Preview may not set `NODE_ENV=production` |
| Error serialization | Pass `Error` instance without serializer config | Register `pino.stdSerializers.err` for each key (`err`, `cause`) |
| `cause` field | Pass `err.cause` directly (`unknown`) | `err.cause instanceof Error ? err.cause : undefined` |
| `register()` export | Omit if body is empty | Always export — required by Next.js guide |
| Deploy-time env validation | `vercel.json` `env.required` | Runtime check in application code |
| `type` field in unknown branch | `'UnknownError'` always | `err instanceof Error ? err.constructor.name : 'UnknownError'` |

---

## Prevention

- **Run `pnpm audit --audit-level=high` in CI.** Fail the build on high or critical findings. For moderate findings in transitive deps, apply `pnpm.overrides` immediately rather than waiting for upstream.
- **Never spread raw `unknown` catch values into pino merge objects.** Narrow to `Error | { message: string }` before logging. Add a code review checklist item for this.
- **Always verify Next.js hook signatures against installed types** (`node_modules/next/dist/`), not prose documentation. Run `pnpm tsc --noEmit` before assuming a type is what the docs say.
- **Test log output in CI.** Wire up a pino `pino.destination` stream in tests and assert that logged error objects contain `message` and `stack`, not `{}`.

---

## Why This Matters

- **Credential leakage is silent.** A `NeonDbError` thrown as `AppError.cause` carries connection metadata. Without serializers and `cause` narrowing, it logs wholesale to your Vercel log drain — no warning, no build error.
- **Preview deployments are your QA surface.** Worker thread spawns from the wrong pino-pretty guard make Preview cold starts 30–80ms slower and can fail if pino-pretty is not installed.
- **`NEXT_RUNTIME` undefined in local dev is a footgun.** Every instrumentation guard must assert `=== 'edge'`, not `!== 'nodejs'`.

---

## Referenced Files

- `src/lib/logger.ts` — pino singleton with serializers and redact config
- `src/instrumentation.ts` — `onRequestError` hook with edge runtime guard
- `src/lib/handler.ts` — `withErrorHandling` HOF with structured log calls
- `src/lib/api-error.ts` — `AppError` hierarchy (`cause: unknown`)
- `.env.local.example` — `LOG_LEVEL` documentation
- `package.json` — `pnpm.overrides` for transitive dep vulnerability pinning
