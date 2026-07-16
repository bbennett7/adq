---
title: "feat: Add PostHog analytics and email signup form"
type: feat
status: active
date: 2026-05-24
---

# feat: Add PostHog analytics and email signup form

## Overview

Add client-side analytics (PostHog) for pageview tracking and an inline email signup form on the home page that collects subscribers into a Resend Audience. PostHog uses a reverse proxy through `/ingest` to avoid CSP issues and ad blockers. The email form is a minimal client component that POSTs to a new `/api/subscribe` route.

## Problem Statement / Motivation

The site has no analytics — we can't see traffic patterns, popular questions, or how visitors navigate. We also have no way to collect emails from interested readers who want to receive the daily question. Both are table-stakes for a publication.

## Proposed Solution

### Phase 1: PostHog Analytics

1. Install `posthog-js` (manual approach for control over initialization)
2. Create `src/components/PostHogProvider.tsx` ('use client') with:
   - Conditional init (only when `NEXT_PUBLIC_POSTHOG_KEY` exists)
   - `capture_pageview: false` (manual tracking for App Router)
   - `api_host: '/ingest'` (proxy to avoid CSP/ad-blocker issues)
3. Create `src/components/PostHogPageview.tsx` ('use client') that uses `usePathname()` + `useSearchParams()` to fire `$pageview` on route changes, wrapped in `<Suspense>`
4. Wrap `{children}` in `layout.tsx` body with PostHogProvider (layout stays a Server Component)
5. Add rewrites to `next.config.ts` for `/ingest` → PostHog US cloud
6. Add `skipTrailingSlashRedirect: true` to `next.config.ts` (PostHog API uses trailing slashes)
7. No CSP changes needed (proxy is same-origin)

### Phase 2: Email Signup Form

1. Add `SubscribeSchema` to `src/lib/schemas.ts`: `{ email: z.string().email() }`
2. Create `src/app/api/subscribe/route.ts`:
   - Uses `withErrorHandling()` wrapper
   - Validates body with Zod
   - Calls `resend.contacts.create()` with the audience ID
   - Returns uniform 200 for both new and existing contacts (no email enumeration)
3. Create `src/components/EmailSignup.tsx` ('use client'):
   - Inline form: headline + email input + submit button
   - States: idle, loading (disabled), success, error
   - Fires PostHog events: `email_signup_submitted`, `email_signup_success`
   - Stores success in localStorage to suppress form on return visits
4. Import `<EmailSignup />` into the home page below the `.columns` section
5. Add form/input CSS to `globals.css` matching existing design tokens

## Technical Considerations

### Architecture

- PostHog is client-only (no `posthog-node` needed for basic pageviews)
- The `/ingest` proxy uses Next.js `rewrites()` — same-origin requests, no CSP changes required
- The subscribe endpoint is stateless — no database table, just forwards to Resend
- Rate limiting is already handled by the existing `proxy.ts` (100 req/min per IP on `/api/*`)

### PostHog Proxy Rewrites

```ts
async rewrites() {
  return [
    { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
    { source: '/ingest/:path*', destination: 'https://us.i.posthog.com/:path*' },
  ];
}
```

### PostHog Init Config

```ts
posthog.init(key, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  capture_pageview: false,
  capture_pageleave: true,
  persistence: 'localStorage+cookie',
})
```

### Resend Subscribe Pattern

```ts
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.contacts.create({
  email: body.email,
  audienceId: process.env.RESEND_AUDIENCE_ID!,
});
```

Resend's `contacts.create()` is idempotent — duplicate emails return success without error. We return the same 200 response regardless, preventing email enumeration.

### Custom PostHog Events

| Event | When | Properties |
|---|---|---|
| `email_signup_submitted` | User clicks Subscribe | - |
| `email_signup_success` | API returns 200 | - |

No `posthog.identify()` call — we keep subscribers anonymous in analytics.

## System-Wide Impact

- **CSP**: No changes needed (proxy is same-origin)
- **Bundle size**: `posthog-js` adds ~20KB gzipped to client bundle
- **Performance**: PostHog loads async, does not block render; form is below fold
- **Existing rate limiting**: The `/api/subscribe` route is already covered by `proxy.ts` (100 req/min/IP)

## Acceptance Criteria

- [ ] PostHog captures pageviews on every route (home, archive, question pages, about)
- [ ] PostHog events proxy through `/ingest` (no direct PostHog domain requests)
- [ ] PostHog gracefully does nothing when `NEXT_PUBLIC_POSTHOG_KEY` is not set
- [ ] Email signup form renders on home page below the columns section
- [ ] Form validates email client-side before submission
- [ ] Successful submission shows confirmation message
- [ ] Invalid email shows inline error
- [ ] Already-subscribed emails return success (no distinction from new)
- [ ] Form is hidden on return visits after successful signup (localStorage)
- [ ] Form works in light and dark mode
- [ ] Form is responsive (stacks on mobile)
- [ ] `email_signup_submitted` and `email_signup_success` events fire in PostHog
- [ ] Environment variables documented in `.env.local.example`

## Dependencies & Risks

| Dependency | Risk | Mitigation |
|---|---|---|
| PostHog US cloud availability | Low — well-established SaaS | Events are queued client-side, retried automatically |
| Resend API availability | Low | Return friendly "try again" message on 5xx |
| `NEXT_PUBLIC_POSTHOG_KEY` missing in dev | Confusing DX | Guard initialization on key existence |
| PostHog SDK + React 19 | Very low — confirmed compatible | Pin `posthog-js` version if issues arise |

## Environment Variables

| Variable | Type | Description |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | PostHog host (default: `https://us.i.posthog.com`) |
| `RESEND_API_KEY` | Server | Resend API key (already have this) |
| `RESEND_AUDIENCE_ID` | Server | Resend audience to add contacts to |

## Implementation Phases

### Phase 1: PostHog (files to create/modify)

| Action | File |
|---|---|
| Install | `pnpm add posthog-js` |
| Create | `src/components/PostHogProvider.tsx` |
| Create | `src/components/PostHogPageview.tsx` |
| Modify | `src/app/layout.tsx` — wrap children with provider |
| Modify | `next.config.ts` — add rewrites + skipTrailingSlashRedirect |
| Modify | `.env.local.example` — add PostHog vars |

### Phase 2: Email Signup (files to create/modify)

| Action | File |
|---|---|
| Modify | `src/lib/schemas.ts` — add `SubscribeSchema` |
| Create | `src/app/api/subscribe/route.ts` |
| Create | `src/components/EmailSignup.tsx` |
| Modify | `src/app/page.tsx` — add EmailSignup below columns |
| Modify | `src/app/globals.css` — add form/input styles |
| Modify | `.env.local.example` — add Resend vars |

## Design Spec — Email Signup Form

### Layout

Below the `.columns` section on the home page. Full-width, centered, with a border-top separator.

### Copy

- **Headline**: "Get each question in your inbox" (font-question, weight 700)
- **Subtext**: "One foundational AI question, every weekday morning." (font-body, muted color)
- **Input placeholder**: "you@example.com"
- **Button label**: "Subscribe"
- **Success message**: "You're in — look for us weekday mornings."
- **Error message**: "Something went wrong. Try again?"
- **Validation error**: "Enter a valid email address."

### States

| State | Visual |
|---|---|
| Idle | Input + button, default styling |
| Focused | Input border becomes `--accent` color |
| Loading | Button shows "..." or spinner, input disabled |
| Success | Form replaced with success message + checkmark |
| Error (validation) | Red border on input, inline error text below |
| Error (server) | Inline error text below form |

### Responsive

- Desktop: Input and button on same row (flex)
- Mobile: Input stacks above button (flex-wrap or column)

### Accessibility

- Visible `<label>` with `sr-only` class (visually hidden, screen-reader accessible)
- `aria-live="polite"` region for success/error announcements
- `aria-invalid` + `aria-describedby` on input when validation fails
- Button disabled during loading (prevents double-submit)
- Enter key submits form

## Sources & References

- PostHog Next.js App Router docs: https://posthog.com/docs/libraries/next-js
- PostHog reverse proxy guide: https://posthog.com/docs/advanced/proxy/nextjs
- Resend Contacts API: https://resend.com/docs/api-reference/contacts/create-contact
- Existing API pattern: `src/app/api/revalidate/route.ts`
- Existing client component pattern: `src/components/ThemeToggle.tsx`
