---
title: Build askdumbquestions.ai
type: feat
status: active
date: 2026-04-12
origin: docs/brainstorms/2026-04-12-askdumbquestions-requirements.md
---

# Build askdumbquestions.ai

## Overview

Build and ship askdumbquestions.ai — a personal AI-education publication with a daily Q&A and occasional longer field notes. The site has two audiences: the public (read-only) and the owner (publishing workflow). An AI agent runs each weekday morning to generate Q&A candidates from a curated source list; the owner reviews, selects, optionally edits, and publishes — all in under 5 minutes.

**Stack:** Next.js (App Router) · TypeScript · Neon (Postgres) · Drizzle ORM · Vercel · Resend · sanitize-html

## Problem Statement

The AI space is loud, moves fast, and rewards confident-sounding nonsense. There is no low-noise, digestible daily destination for people who want to actually understand AI. This site fills that gap with one honest question per weekday — foundational or timely things that are easy to assume you understand, but harder to answer explicitly — plus occasional practitioner field notes. The voice is a builder who is an authority on learning and navigating, not a fake expert in a nascent and evolving field.

(see origin: docs/brainstorms/2026-04-12-askdumbquestions-requirements.md)

---

## Implementation Phases

### Phase 1 — Foundation

**Goal:** Working Next.js app deployed to Vercel with design system implemented. No database yet.

#### Tasks

- [ ] Initialize Next.js project with App Router and TypeScript (`npx create-next-app@latest`)
- [ ] Configure Vercel project, connect GitHub repo, set up preview deploys
- [ ] Implement global CSS design system:
  - CSS custom properties: `--forest`, `--forest-l`, `--sage`, `--stone`, `--stone-2`, `--stone-3`, `--rule`, `--rule-dk`, `--ink`, `--muted`, `--vmuted`
  - Google Fonts: Bricolage Grotesque, DM Sans, Fira Code, Newsreader, Caveat
  - Base reset and body defaults
- [ ] Build shared layout components: `<Nav>`, `<Footer>`, `<PageContainer>`
- [ ] Implement scroll-aware nav (adds `.scrolled` class + shadow at 20px scroll)
- [ ] Set up environment variable structure (`.env.local`, Vercel env vars)

#### Key files
- `src/app/layout.tsx` — root layout with nav + footer
- `src/styles/globals.css` — design tokens and base styles
- `src/components/Nav.tsx`, `Footer.tsx`

---

### Phase 2 — Static Site

**Goal:** All public pages built pixel-faithful to the mockups, deployed and live, with hardcoded placeholder content where dynamic data will eventually live. The site looks intentional and complete, not broken. Mobile-responsive CSS is implemented here — not deferred to Phase 7 — so every page works at all screen sizes from the moment it ships.

#### Placeholder approach

Dynamic sections get an elegant empty state that fits the site's voice:
- **Today's Q&A card** — rendered in full but with placeholder text: question panel reads *"questions start soon."*, answer panel reads *"one question, every weekday. starting [launch date]."*
- **Recent questions list** — hidden or replaced with a brief Fira Code note: `// questions coming soon`
- **Field notes sidebar / index** — same treatment: `// first note coming soon`
- **Archive** — empty state matching the design, with the month header and filter bar visible but no rows

Everything structural (nav, footer, card layout, typography, spacing, hover states, animations) is fully built and correct.

#### Pages

**Home (`/`)**
- Full today-card layout with placeholder content
- Yesterday row and recent questions list in placeholder/hidden state
- Field notes sidebar in placeholder state
- All animations (`fadeUp f1/f2/f3`) working

**Archive (`/archive`)**
- Page header, filter bar, month structure all present
- Empty rows state — no question rows yet
- Question count shows `000 questions`

**Field Notes Index (`/field-notes`)**
- Page header with description
- Filter bar present
- Empty state below filters

**Individual Field Note (`/field-notes/[slug]`)**
- Article layout built as a static example using one hardcoded note
- Will be replaced with dynamic rendering in Phase 4

**About (`/about`)**
- Fully complete — this page is entirely static content
- Three cards: About Me, About This Place, Currently
- "Currently" grid with real content (hardcoded, updated manually for now)

**Footer (all pages)**
- Adds a question counter line below the tagline, in Fira Code:
  `007 asked · ∞ remaining`
- In Phase 2 this is hardcoded; in Phase 4 it becomes a live count from the database

#### Tasks

- [ ] Build all public page shells with placeholder content
- [ ] Implement full mobile-responsive CSS (breakpoints at 768px and 480px) for all pages
- [ ] Verify hover states, animations (`fadeUp f1/f2/f3`), and layout at all screen sizes

#### Key files
- `src/app/page.tsx` — home with placeholders
- `src/app/archive/page.tsx`
- `src/app/field-notes/page.tsx`
- `src/app/field-notes/[slug]/page.tsx`
- `src/app/about/page.tsx`
- `src/components/TodayCard.tsx`
- `src/components/QuestionArchiveRow.tsx`
- `src/components/NoteRow.tsx`
- `src/components/NoteFeatured.tsx`

---

### Phase 3 — Data Model

**Goal:** Schema defined, migrated, seeded with the mockup data, and data access layer ready for Phase 4 to consume.

#### Setup

- [ ] Create Neon database (dev + prod branches)
- [ ] Install and configure Drizzle ORM with Neon driver (`drizzle-orm`, `@neondatabase/serverless`)

#### Schema

**`questions` table**
```ts
// src/db/schema.ts
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),          // YYYY-MM-DD, one per weekday
  question: text('question').notNull(),           // markdown with limited inline HTML (see Rich Text note)
  answer: text('answer').notNull(),               // markdown with limited inline HTML (see Rich Text note)
  callout: text('callout'),                       // optional editorial aside — a short honest qualifier shown below the answer in handwritten Caveat font
  furtherReading: jsonb('further_reading'),       // [{ label, url }]
  topic: topicEnum('topic').notNull(),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(), // updated on every write
  deletedAt: timestamp('deleted_at'),             // soft delete — null means active
});
```

**`field_notes` table**
```ts
export const fieldNotes = pgTable('field_notes', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  body: text('body').notNull(),                   // markdown
  tag: notesTagEnum('tag').notNull(),
  readingMinutes: integer('reading_minutes'),
  publishedAt: timestamp('published_at'),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(), // updated on every write
  deletedAt: timestamp('deleted_at'),             // soft delete — null means active
});
```

**`candidates` table** (AI-generated daily Q&A suggestions)
```ts
export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  callout: text('callout'),
  furtherReading: jsonb('further_reading'),       // [{ label, url }] — carried forward to questions on publish
  topic: topicEnum('topic').notNull(),
  sourceExcerpts: jsonb('source_excerpts'),       // raw source context shown during review
  selected: boolean('selected').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(), // updated on every write
  deletedAt: timestamp('deleted_at'),             // soft delete — null means active
});
```

**`backlog` table** (curated pool of unpublished questions)
```ts
export const backlog = pgTable('backlog', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),           // markdown with limited inline HTML
  answer: text('answer').notNull(),               // markdown with limited inline HTML
  callout: text('callout'),
  furtherReading: jsonb('further_reading'),       // [{ label, url }]
  topic: topicEnum('topic').notNull(),
  source: text('source'),                         // 'manual' or 'candidate:{id}'
  usedAt: timestamp('used_at'),                   // set when published — null means available
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(), // updated on every write
  deletedAt: timestamp('deleted_at'),             // soft delete — null means active
});
```

Backlog questions have no `date` or `published` flag. When published, `usedAt` is set and the question is inserted into the `questions` table with today's date — the backlog row is retained for history. All queries for available backlog filter `WHERE used_at IS NULL AND deleted_at IS NULL`.

#### Rich Text Note

Both `question` and `answer` store markdown with a limited inline HTML allowlist. No schema change is needed — the styling lives in the renderer and CSS, not the data.

**Allowed inline markup:**
- `**bold**` → `<strong>` (key terms in answers)
- `*italic*` → `<em>`
- `<span class="sage">` → sage green accent color
- `<span class="muted">` → de-emphasized text
- `<span class="script">` → Caveat font (handwritten feel inline)
- `<span class="serif">` → Newsreader italic (contrast within sans-serif)

**Rendering:** Both fields use `react-markdown` with `rehype-sanitize` configured to allow only the tags and class names above. Everything else is stripped. The question headline renders as HTML (not plain text) so inline spans take effect.

**Sanitization on write:** Content is sanitized using `sanitize-html` (Node.js-compatible) in the API route / server action *before* the INSERT or UPDATE, not just at render time. The same allowlist applies: `strong`, `em`, `span` with the named classes only. This ensures the database never contains unsanitized markup regardless of how the data was written.

#### Soft Deletes

All four tables (`questions`, `field_notes`, `candidates`, `backlog`) carry:
- `created_at` — set on insert
- `updated_at` — updated on every write, tracks in-place edits
- `deleted_at` — soft delete; null means active. Nothing is ever hard-deleted. All queries filter `WHERE deleted_at IS NULL` by default.

The `backlog` table additionally has `used_at` to distinguish "published and used" from "soft deleted" — a used backlog question is history; a deleted one was discarded.

**Enums**
```ts
// Questions archive topic filter
export const topicEnum = pgEnum('topic', [
  'agents', 'models', 'evaluation', 'infrastructure', 'hype'
]);

// Field notes topic filter
export const notesTagEnum = pgEnum('notes_tag', [
  'infrastructure', 'evaluation', 'architecture', 'tooling', 'process'
]);
```

#### Tasks

- [ ] Write `src/db/schema.ts` with tables and enums above
- [ ] Generate and run initial migration (`drizzle-kit generate`, `drizzle-kit migrate`)
- [ ] Write seed script with all 7 mockup questions and 5 mockup field notes
- [ ] Write data access functions: `getTodayQuestion()`, `getRecentQuestions(n)`, `getRecentNotes(n)`, `getAllQuestions()`, `getQuestionCount()`, `getAllNotes()`, `getNoteBySlug()`, `getCandidatesByDate()`, `getBacklog()`, `addToBacklog()`, `publishFromBacklog(id)`

#### Key files
- `src/db/schema.ts`
- `src/lib/db.ts` — Drizzle client
- `src/db/queries.ts`
- `src/db/seed.ts`
- `drizzle.config.ts`

---

### Phase 4 — Dynamic Wiring

**Goal:** Replace all static placeholders with real database queries. The public site now renders live data exactly as the mockups show.

#### Tasks

- [ ] Wire `getTodayQuestion()` into home page — replace placeholder card with real Q&A
- [ ] Wire `getRecentQuestions(6)` into home page recent questions list
- [ ] Wire `getRecentNotes(3)` into home page field notes sidebar
- [ ] Wire `getAllQuestions()` into archive page — real rows, real count, real topic filter
- [ ] Wire `getAllNotes()` into field notes index — featured + list layout with real data
- [ ] Wire `getNoteBySlug()` into individual note page — replace hardcoded example
- [ ] Wire live question count into footer (`getQuestionCount()`) — replaces hardcoded number in `007 asked · ∞ remaining`
- [ ] Add ISR rendering strategy: `revalidate: 86400` on all public pages (safety net); publish action in Phase 5 will call `revalidatePath('/')` for immediate refresh

#### Key files
- Updates to `src/app/page.tsx`, `archive/page.tsx`, `field-notes/page.tsx`, `field-notes/[slug]/page.tsx`

---

### Phase 5 — Switchboard

**Goal:** Owner can log in, review daily candidates, select and publish a question, and write/publish field notes — all in under 5 minutes.

#### Auth

Simple token auth — no NextAuth, no user table:
- `SWITCHBOARD_PASSWORD` env var
- `/switchboard/login`: form that validates password, sets signed httpOnly cookie (`switchboard_token`)
- Middleware (`src/middleware.ts`) checks cookie on all `/switchboard/*` routes, redirects to login if missing

#### Pages

**`/switchboard`** — Dashboard
- Today's published question status (published / pending)
- Link to candidates review
- Link to backlog (shows count: "12 in backlog")
- Link to field notes
- **Regenerate candidates** — button + optional feedback textarea: *"What didn't work about today's candidates?"*. Submits to `/api/agent/generate` with the feedback string and today's existing candidates as context. **Appends** new candidates to today's list rather than overwriting.

**`/switchboard/candidates`** — Daily Q&A review
- Shows today's candidates (question, answer, callout, source excerpts for context)
- Two actions per candidate: **"Select & Publish"** and **"Save to Backlog"**
- On publish: sanitizes content, saves to `questions` table, marks candidate `selected: true`, calls `revalidatePath('/')`
- On save to backlog: sanitizes content, inserts into `backlog` table with `source: 'candidate:{id}'`
- **Inline editing**: question, answer, and callout are editable in place before either action — sets `updated_at` on save

**`/switchboard/backlog`** — Backlog queue
- Lists all saved backlog questions (question, answer, topic, date saved)
- "Publish Today" button on each — inserts into `questions` table with today's date, removes from backlog, calls `revalidatePath('/')`
- "Delete" button to discard
- "Add manually" button → inline form to write a question directly into the backlog

**`/switchboard/notes`** — Field Notes management
- List of all notes (published + drafts)
- "New Note" button → `/switchboard/notes/new`
- Edit existing note

**`/switchboard/notes/new` and `/switchboard/notes/[id]/edit`** — Note editor
- Fields: title, slug (auto-generated from title, editable), excerpt, tag (dropdown), body (markdown textarea)
- Live markdown preview panel (right side, uses `react-markdown`)
- Reading time estimate (auto-calculated from word count)
- Save draft / Publish buttons

#### Tasks

- [ ] Implement `/switchboard/login` with `SWITCHBOARD_PASSWORD` validation and cookie issuance
- [ ] Write `src/middleware.ts` — check `switchboard_token` cookie on all `/switchboard/*` routes
- [ ] Build `/switchboard` dashboard — published status, candidate count, backlog count, regenerate button
- [ ] Build `/switchboard/candidates` — candidate review with inline editing, Select & Publish, Save to Backlog
- [ ] Build `/switchboard/backlog` — list with Publish Today, Delete, Add Manually actions
- [ ] Build `/switchboard/notes` — notes list with New Note button
- [ ] Build `/switchboard/notes/new` and `/switchboard/notes/[id]/edit` — editor with markdown preview
- [ ] Wire all Switchboard actions to API routes with sanitization on every write

#### Key files
- `src/app/switchboard/layout.tsx` — auth guard
- `src/app/switchboard/page.tsx`
- `src/app/switchboard/candidates/page.tsx`
- `src/app/switchboard/backlog/page.tsx`
- `src/app/switchboard/notes/page.tsx`
- `src/app/switchboard/notes/new/page.tsx`
- `src/app/switchboard/notes/[id]/edit/page.tsx`
- `src/middleware.ts` — cookie check
- `src/app/api/switchboard/publish/route.ts`
- `src/app/api/switchboard/notes/route.ts`

---

### Phase 6 — Daily AI Workflow

**Goal:** A Vercel Cron job runs each weekday morning, ingests sources, generates 3–5 Q&A candidates via Claude API, stores them, and notifies the owner.

#### Source list and access methods

| Source | Access |
|--------|--------|
| Hacker News (AI stories) | Algolia HN API — free, no auth |
| Latent Space | RSS feed |
| Simon Willison's Weblog | RSS feed |
| Interconnects (Nathan Lambert) | RSS feed |
| The Batch (Andrew Ng) | RSS feed |
| Lenny's Newsletter | RSS feed |
| TechCrunch AI | RSS feed |
| OpenAI announcements | RSS feed / blog scrape |
| Anthropic announcements | RSS feed / blog scrape |
| Meta AI announcements | RSS feed / blog scrape |
| Google Gemini announcements | RSS feed / blog scrape |
| arXiv cs.AI | RSS feed |
| X (Twitter) | ⚠️ API v2 Basic tier required ($100/mo) — deferred; scrape-based fallback if needed |
| BlueSky | AT Protocol API — free, open |

> **Note on X/Twitter:** The Twitter API v2 free tier no longer supports timeline/search reads. Reading AI content from X requires the Basic tier (~$100/month). Recommendation: defer X integration and revisit after launch. BlueSky's AT Protocol is free and covers a similar audience.

#### Generation pipeline

```
Vercel Cron (weekday 6am PT)  — or manual trigger from /switchboard
  → /api/agent/generate (POST)
      → body: { feedback?: string }   // optional from manual trigger
      → Fetch last 24h from each source
      → Truncate/summarize to fit context
      → If feedback provided: include existing candidates + feedback in prompt
      → Claude API: generate 3-5 Q&A candidates
      → INSERT into candidates table (always appends — never overwrites)
      → Send notification (Resend email)
```

#### Claude prompt design

The prompt must enforce the site's question style: foundational or timely questions that are easy to assume you understand, but harder to answer clearly and explicitly. Threshold/boundary questions ("when does X become Y?") are one good pattern but not the only one — conceptual questions ("how is a GPU different from a CPU?"), definitional-but-genuinely-hard questions, and timely questions about recent developments all qualify. Key constraints:
- Question should feel like something most people assume they understand, but would struggle to answer precisely if asked
- Answer must be under ~80 words
- Optional callout: a short honest aside (e.g. "note: most things called 'agentic' right now are still just describing.")
- Topic must match the controlled enum
- Further reading: 1–2 credible links

#### Notification architecture (pluggable)

```ts
// src/lib/notifications/types.ts
interface NotificationAdapter {
  send(payload: NotificationPayload): Promise<void>
}

// Implementations:
// src/lib/notifications/resend.ts   ← v1
// src/lib/notifications/twilio.ts   ← future
// src/lib/notifications/onesignal.ts ← future (iOS web push)
```

Resend email includes: date, number of candidates generated, link to `/switchboard/candidates`.

#### OneSignal (future iOS push)
- OneSignal supports Web Push on iOS 16.4+ for sites added to Home Screen
- Notifications can deep-link to `/switchboard/candidates`
- Free tier supports up to 10,000 subscribers
- Requires a service worker (`/public/OneSignalSDKWorker.js`)
- Architecture is ready to add as a second `NotificationAdapter`

#### Cron security

The `/api/agent/generate` endpoint is publicly reachable — Vercel Cron calls it over HTTP, so it must verify the request is legitimate before running. Verify the `Authorization: Bearer <CRON_SECRET>` header on every request:

```ts
// src/app/api/agent/generate/route.ts
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

Set `CRON_SECRET` as a Vercel environment variable (generate a random string at deploy time). Vercel automatically includes this header when invoking cron routes; the `/switchboard` manual trigger must also include it.

#### Cron configuration

```json
// vercel.json
{
  "crons": [{
    "path": "/api/agent/generate",
    "schedule": "0 14 * * 1-5"
  }]
}
```
(14:00 UTC = 6:00am PT, weekdays only)

#### Key files
- `src/app/api/agent/generate/route.ts` — cron endpoint + manual trigger
- `src/lib/sources/` — one fetcher per source type (rss, hn-api, bluesky)
- `src/lib/claude.ts` — Claude API client wrapper
- `src/lib/notifications/` — adapter interface + Resend implementation
- `vercel.json` — cron schedule

---

### Phase 7 — Production Readiness

**Goal:** Mobile-responsive, SEO-complete, analytics live, domain pointed.

#### Tasks

- [ ] `<head>` metadata: title templates, description, canonical URLs
- [ ] Dynamic OG images via `@vercel/og`:
  - `/api/og/question?date=2026-04-07` — renders question text in site design
  - `/api/og/note?slug=...` — renders note title + tag
- [ ] Vercel Analytics (`@vercel/analytics`) — one import in root layout
- [ ] `robots.txt` and `sitemap.xml` (auto-generated from published questions + notes)
- [ ] Error states: what shows on home if no question is published yet today
- [ ] 404 page matching design system
- [ ] Domain `askdumbquestions.ai` → Vercel DNS configuration

#### Key files
- `src/app/api/og/question/route.tsx`
- `src/app/api/og/note/route.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/not-found.tsx`

---

## Acceptance Criteria

### Functional

- [ ] R1. Home page shows today's published Q&A card, recent questions, and 3 most recent field notes
- [ ] R2. Archive lists all questions grouped by month with expandable answers and topic filter
- [ ] R3. Field Notes index with featured + list layout and topic filter
- [ ] R4. Individual field note pages render full markdown body
- [ ] R5. About page with three cards including "Currently" grid
- [ ] R7. Daily AI workflow generates 3–5 candidates each weekday morning without manual triggering
- [ ] R8. Switchboard: owner can review candidates, select one, edit if needed, and publish in under 5 minutes
- [ ] R9. Switchboard: owner can write, preview, and publish field notes with tag and excerpt
- [ ] R10. Design matches mockups: palette, typography, card layouts, hover states, animations

### Non-Functional

- [ ] Home page loads in <2s on fast 3G (ISR + Vercel edge cache)
- [ ] Switchboard auth is secure (signed httpOnly cookie, `SWITCHBOARD_PASSWORD` env var)
- [ ] Cron endpoint verifies `Authorization: Bearer <CRON_SECRET>` before running
- [ ] Cron job has a manual fallback trigger in Switchboard
- [ ] Notification system is built as pluggable adapters (Resend v1, Twilio + OneSignal ready to add)
- [ ] No `/start` route (removed from nav and routing)

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Neon + Drizzle | Serverless Postgres with generous free tier; Drizzle is TypeScript-native with no codegen step |
| Topic tags | Controlled enum | Filter bar requires known values; free-form risks silent inconsistency |
| Question URLs | Date-based (`/archive/2026-04-07`) | Date is the natural unique key; zero slug management |
| Admin auth | Simple token (env var + httpOnly cookie) | One user — NextAuth complexity is unnecessary |
| Field Notes editor | Textarea + markdown preview | Technical writer who thinks in markdown; precise control, zero extra dependencies |
| OG images | Dynamic per question (`@vercel/og`) | Shareable unit is the daily question; generic static image misses the point |
| Analytics | Vercel Analytics | Zero-config, privacy-friendly, free tier sufficient |
| Notification | Resend (v1), pluggable interface | Start simple; Twilio + OneSignal can be dropped in as adapters |
| X/Twitter | Deferred | API v2 Basic required at ~$100/mo; BlueSky covers similar audience for free |

(see origin: docs/brainstorms/2026-04-12-askdumbquestions-requirements.md)

---

## Dependencies & Prerequisites

- Neon account (free tier)
- Vercel account (free tier)
- Anthropic API key
- Resend account (free tier, 3,000 emails/month)
- Domain `askdumbquestions.ai` pointed to Vercel

## Risks

- **X/Twitter source:** API access requires paid tier — excluded from v1, noted explicitly
- **arXiv content may skew too academic:** Prompt should deprioritize dense paper content in favor of conceptual threshold questions
- **ISR cache and publish timing:** After publishing, `revalidatePath` must be called or home page won't update until natural revalidation

---

## Sources & References

### Origin
- **Origin document:** [docs/brainstorms/2026-04-12-askdumbquestions-requirements.md](../brainstorms/2026-04-12-askdumbquestions-requirements.md) — Key decisions carried forward: Next.js + Vercel stack, threshold-question framing, field notes manually authored, no email newsletter in v1

### Design
- Mockups: `/Users/macuser/Desktop/askdumbquestions-site.zip` (extracted: `index.html`, `archive.html`, `notes.html`, `about.html`, `design-system.html`)

### External References
- [Neon + Drizzle + Next.js docs](https://neon.tech/docs/guides/drizzle)
- [@vercel/og documentation](https://vercel.com/docs/functions/og-image-generation)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Anthropic API (claude-sonnet-4-6)](https://docs.anthropic.com/en/api/getting-started)
- [Resend Next.js guide](https://resend.com/docs/send-with-nextjs)
- [OneSignal Web Push (iOS)](https://documentation.onesignal.com/docs/web-push-quickstart)
