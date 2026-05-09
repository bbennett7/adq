---
title: Next.js 16 App Router — Code Quality Hardening and ISR Patterns
category: integration-issues
date: 2026-05-07
tags: [nextjs, app-router, zod, isr, caching, rate-limiting, api-design, typescript, theme]
symptoms:
  - HTTP URLs passing URL validation instead of being rejected
  - API error handling duplicated across multiple fetch call sites
  - Pages not caching or revalidating correctly under ISR
  - Rate limiter placed in middleware.ts instead of project-conventional proxy.ts
  - Theme flash on initial page load before client hydration
  - Home page making two network fetches for overlapping data
  - req.ip causing TypeScript errors (removed in Next.js 15+)
  - React.cache() mistakenly treated as a persistent cache
components:
  - src/lib/schemas.ts
  - src/lib/api.ts
  - src/lib/data.ts
  - src/proxy.ts
  - src/app/page.tsx
  - src/app/q/[number]/page.tsx
  - src/components/ThemeToggle.tsx
  - next.config.ts
related_issues: []
---

## Context

These patterns emerged from a full code-quality and ISR review of the askdumbquestions.ai Next.js 16 App Router project. Each section documents a root cause and working fix for a class of integration issue with Next.js 16 APIs and conventions.

**Note on versioning:** `AGENT.md` states Next.js 16. All patterns below apply to Next.js 15+ App Router as the API surface is identical. The `compound-engineering.local.md` may still say "Next.js 15" — the version string in `package.json` is authoritative.

---

## 1. Zod URL Validation — `z.url()` Allows HTTP and `javascript:` URIs

### Root Cause
`z.url()` in Zod v4 accepts any structurally valid URI, including `http://` and `javascript:` schemes. For a content site with user-editable resource links, this is an XSS vector.

### Solution
Chain `.refine()` immediately after `z.url()`:

```ts
url: z
  .url()
  .refine((u) => u.startsWith('https://'), {
    message: 'URL must use https',
  })
```

### Prevention
Never use bare `z.url()` for external URLs. Create a shared `httpsUrl` schema in `src/lib/schemas.ts` and import it everywhere URL validation is needed.

---

## 2. Centralized API Error Handling — `apiFetch` Utility

### Root Cause
Each API call site duplicated `res.ok` checks and error-body parsing inline, producing inconsistent error messages and scattered logic.

### Solution
Extract a shared wrapper in `src/lib/api.ts`:

```ts
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const parsed = body ? ApiErrorSchema.safeParse(body) : null;
    throw new Error(
      parsed?.success ? parsed.data.error : `Request failed: ${res.status}`,
    );
  }
  return res;
}
```

`options?: RequestInit` passthrough makes it flexible for POST, custom headers, timeouts, etc. The caller always receives either the raw `Response` (success) or a thrown `Error` (failure) — no mixed return shapes.

### Prevention
All client-side fetches go through `apiFetch`. Raw `fetch()` calls with manual `res.ok` checks outside `src/lib/api.ts` are a code smell and should be flagged in review.

> **See also:** For centralized error handling in *route handlers* (server side), see [Drizzle ORM + Neon Data Layer — §5](../best-practices/drizzle-orm-neon-data-layer-nextjs-2026-05-09.md) — the `AppError` hierarchy and `withErrorHandling` HOF.

---

## 3. Caching in Next.js 16 App Router

### Root Cause
Next.js 16 introduced the `'use cache'` directive as the preferred caching primitive, replacing the older `export const revalidate` route segment config. Silence means "dynamic by default" — not "cached."

### Prerequisite: `cacheComponents: true` in `next.config.ts`
The `'use cache'` directive requires `cacheComponents: true` in `next.config.ts`. This is a **Next.js 16** option — it replaces `experimental.dynamicIO` from Next.js 15; using the old key has no effect. See [Drizzle ORM + Neon Data Layer — §6](../best-practices/drizzle-orm-neon-data-layer-nextjs-2026-05-09.md) for the full config and migration notes.

### Preferred Approach: `'use cache'` Directive (Next.js 16)
Add `'use cache'` at the top of a file, component, or async function:

```ts
// Entire page cached
export default async function Page() {
  'use cache'
  const data = await db.questions.findMany()
  return <QuestionList items={data} />
}

// Or just a specific data function
async function getData() {
  'use cache'
  return await db.questions.findMany()
}
```

Use `cacheLife` for TTL control:
```ts
import { cacheLife } from 'next/cache'

export default async function Page() {
  'use cache'
  cacheLife('max') // or a number in seconds
  // ...
}
```

### Legacy Approach: `export const revalidate` (still works)
```ts
export const revalidate = 3600; // at top of file, before imports
```
Still valid but superseded by `'use cache'`. Prefer `'use cache'` for new code.

### Dynamic Routes with Full Static Generation
These are unchanged in Next.js 16:
```ts
export const dynamicParams = false; // return 404 for unrecognized params

export async function generateStaticParams() {
  const questions = await getAllQuestions();
  return questions.map((q) => ({ number: String(q.number) }));
}
```

### API Routes
`export const revalidate` works on route handlers too:
```ts
export const revalidate = 60

export async function GET() { ... }
```

### `React.cache()` Scope
`React.cache()` deduplicates calls **within a single render pass only** — it is not a persistent cache between requests. Use it to share one DB call between `generateStaticParams` and `generateMetadata` in the same render. For cross-request caching, use `'use cache'` (preferred) or `unstable_cache`.

### `unstable_cache`
Still available but the docs recommend migrating to `'use cache'` instead.

### Prevention
Every `page.tsx` must declare caching intent via `'use cache'` or `export const revalidate`. Do not rely on implicit defaults — they change between Next.js versions.

---

## 4. Rate Limiter — `proxy.ts` and IP Extraction

### Root Cause
Two things changed in Next.js 15–16:
1. `req.ip` was removed and must be replaced with header-based IP extraction.
2. `middleware.ts` / `export function middleware` was **deprecated in Next.js 16** and renamed to `proxy.ts` / `export function proxy`. This is an official framework change, not a project convention.

### Migration (Next.js 16)
```bash
mv middleware.ts proxy.ts
```
```ts
// Before (deprecated)
export function middleware(request: Request) {}

// After
export function proxy(request: Request) {}
```
`config.matcher` and all other options remain the same. The `edge` runtime is **not** supported in `proxy` — if you need edge runtime, keep using `middleware.ts`.

### IP Extraction (Next.js 15+)
```ts
const ip =
  req.headers.get('x-real-ip') ??
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  'anonymous';
```

Prefer `x-real-ip` (set by reverse proxies like Vercel/Nginx) over `x-forwarded-for` (which can be spoofed when chained). Fall back to `'anonymous'` to bucket unidentifiable callers conservatively.

### In-Memory Rate Limiter (Dev / Single-Instance Only)
```ts
const requests = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 100;

export function proxy(req: NextRequest) {
  const now = Date.now();
  // sweep expired entries to prevent unbounded Map growth
  for (const [key, val] of requests) {
    if (now >= val.reset) requests.delete(key);
  }
  const entry = requests.get(ip);
  if (!entry || now >= entry.reset) {
    requests.set(ip, { count: 1, reset: now + WINDOW_MS });
    return NextResponse.next();
  }
  entry.count += 1;
  if (entry.count > LIMIT) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(WINDOW_MS / 1000)) } },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
```

**Production replacement:** `@upstash/ratelimit` + Vercel KV. The in-memory `Map` resets on every cold start and does not share state across instances.

---

## 5. Single Fetch Pattern — Derive, Don't Re-Fetch

### Root Cause
The home page made two separate database calls: `getLatestQuestion()` for today's question, then `getRecentQuestions({ cursor })` for the preview list. Both queries returned overlapping data.

### Solution
Fetch one extra item and destructure:

```ts
const { questions } = await getRecentQuestions({ limit: HOME_PREVIEW_SIZE + 1 });
const [today, ...recent] = questions;
```

`today` is always the most recent question; `recent` is the remainder for the preview list. No schema changes needed.

### Prevention
Before adding a new data fetch, check whether the data is already derivable from an existing fetch in the same render. Data functions in `src/lib/data.ts` should return complete structures so callers can derive views via destructuring rather than needing a dedicated function.

---

## 6. FOUC Prevention — Theme Applied Before First Paint

### Root Cause
The theme was applied during React hydration, causing a flash of unstyled content (FOUC) when the stored theme differed from the default.

### Solution
Write the resolved theme to `document.documentElement.dataset.theme` in a `useEffect` that runs before React finishes painting:

```ts
useEffect(() => {
  document.documentElement.dataset.theme = resolved;
}, [resolved]);
```

CSS `[data-theme]` selectors pick this up immediately. This avoids the flash without requiring a blocking `<script>` in the document head.

The layout also injects a small inline script in `<head>` that reads `localStorage` and sets the data attribute before any paint — the `ThemeToggle` then keeps it in sync after hydration.

---

## Related Files

| Topic | Primary file |
|---|---|
| HTTPS URL validation | `src/lib/schemas.ts` |
| apiFetch utility | `src/lib/api.ts` |
| ISR — pages | `src/app/page.tsx`, `src/app/archive/page.tsx` |
| ISR — question detail | `src/app/q/[number]/page.tsx` |
| ISR — API cache headers | `src/app/api/questions/route.ts` |
| Rate limiter | `src/proxy.ts` |
| FOUC prevention | `src/app/layout.tsx`, `src/components/ThemeToggle.tsx` |
| Single fetch pattern | `src/app/page.tsx`, `src/lib/data.ts` |
