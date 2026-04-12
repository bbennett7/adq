---
title: Always Verify CRON_SECRET on Vercel Cron Endpoints
date: 2026-04-12
category: docs/solutions/best-practices/
module: askdumbquestions.ai
problem_type: best_practice
component: authentication
severity: high
applies_when:
  - "A Next.js route is listed under `crons` in vercel.json"
  - "A UI needs to manually trigger a cron endpoint (e.g. an admin panel with a 'Regenerate' button)"
  - "Any server-side endpoint invoked exclusively by an automated caller (cron, webhook, internal service)"
root_cause: missing_validation
resolution_type: code_fix
tags: [vercel, cron, cron-secret, security, authorization, next-js, api-route, bearer-token]
---

# Always Verify CRON_SECRET on Vercel Cron Endpoints

## Context

Vercel Cron Jobs invoke endpoints via standard HTTP requests to routes defined in `vercel.json`
under `crons`. Because those routes are ordinary Next.js API routes, they are publicly reachable
by anyone who knows the URL — Vercel provides no network-level restriction that limits access to
cron-only callers.

This gap was identified during architectural planning for askdumbquestions.ai, where the daily AI
content pipeline runs at `/api/agent/generate`. Without a guard, that endpoint was as open as any
other public route — any external actor could trigger it by hitting the URL directly.

The fix is a single auth check added as the first line of the handler. Vercel automatically
injects `Authorization: Bearer <CRON_SECRET>` when it invokes a cron route; any other caller
is rejected with a 401.

## Guidance

Every route listed under `crons` in `vercel.json` must verify the `Authorization: Bearer <CRON_SECRET>`
header before executing any logic. The check must come first — before any database access, API
calls, or business logic.

```ts
// src/app/api/agent/generate/route.ts
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Safe to proceed — caller is verified
  // ... rest of pipeline
}
```

Set `CRON_SECRET` in Vercel project settings (Dashboard → Project → Settings → Environment
Variables). Use a long, randomly generated string — e.g. `openssl rand -hex 32`. Never hardcode
it or commit it to version control.

**For routes that also accept manual triggers** (e.g. an admin panel with a "Regenerate" button),
the calling code must explicitly attach the same header. Because the secret must never reach the
browser, this call must happen inside a server action or an internal API route — not in
client-side fetch:

```ts
// src/app/actions/regenerate.ts — server action, secret never reaches the browser
'use server'

export async function triggerRegenerate(feedback: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agent/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ feedback }),
  })

  if (!res.ok) throw new Error(`Pipeline trigger failed: ${res.status}`)
  return res.json()
}
```

**For projects with multiple cron routes**, extract the check into a shared utility:

```ts
// src/lib/cron-auth.ts
export function verifyCronSecret(request: Request): Response | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  return null  // null means auth passed
}

// Usage in any cron route:
export async function POST(request: Request) {
  const authError = verifyCronSecret(request)
  if (authError) return authError
  // ...
}
```

## Why This Matters

- **Cost control.** AI pipelines call paid APIs. An unsecured endpoint lets anyone trigger those
  calls and run up the bill.
- **Data integrity.** Cron jobs often write to a database. Uncontrolled invocations can create
  duplicate records, corrupt scheduled state, or cause partial writes.
- **Rate limit exhaustion.** Third-party API rate limits are per-account. Spurious cron invocations
  consume quota that legitimate pipeline runs need.
- **URL obscurity is not access control.** Endpoint paths in `vercel.json` are not secret — they
  can be inferred from source code, discovered via enumeration, or leaked in logs.
- **Vercel's own documentation recommends this pattern.** The `CRON_SECRET` mechanism exists
  precisely because Vercel cannot enforce network-level isolation for cron callers.

## When to Apply

- When adding any new route under `crons` in `vercel.json` — apply the check at creation time,
  not as a follow-up.
- When auditing existing cron routes before deploying a cron configuration for the first time.
- When a cron route is also reachable via a manual trigger from an admin UI or internal tool.
- When the route performs any write operation, calls a paid external API, or triggers a
  multi-step pipeline.

This pattern is not needed for routes that are intentionally public (e.g. webhook receivers
with their own signature verification). But if a route is exclusively intended for scheduled
invocation, `CRON_SECRET` verification is always the right default.

## Examples

**Before — unsecured cron endpoint (vulnerable):**

```ts
export async function POST(request: Request) {
  // No auth check — any HTTP client can trigger this
  const result = await runDailyContentPipeline()
  return Response.json({ ok: true, result })
}
```

**After — secured with CRON_SECRET (correct):**

```ts
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await runDailyContentPipeline()
  return Response.json({ ok: true, result })
}
```

**The `vercel.json` cron entry being protected:**

```json
{
  "crons": [{
    "path": "/api/agent/generate",
    "schedule": "0 14 * * 1-5"
  }]
}
```

## Related

- Plan: [Phase 6 — Cron security](../../plans/2026-04-12-001-feat-askdumbquestions-site-plan.md#cron-security) — implementation context for askdumbquestions.ai
- [Vercel Cron Jobs documentation](https://vercel.com/docs/cron-jobs) — official guidance on `CRON_SECRET`
