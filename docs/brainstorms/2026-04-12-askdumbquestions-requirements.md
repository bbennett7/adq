---
date: 2026-04-12
topic: askdumbquestions-site
---

# askdumbquestions.ai

## Problem Frame

The AI space is loud, moves fast, and rewards confident-sounding nonsense. People who want to actually understand AI — not just follow the hype — have no low-noise, digestible daily destination. This site is a personal publication at askdumbquestions.ai: one honest question and answer per weekday, plus occasional longer writing from the perspective of someone building AI systems in production. The voice is explicitly "I'm a student, not an expert — come learn with me."

## Requirements

- R1. **Home page** shows today's Q&A as a prominent card (question on dark left panel, answer on light right panel), a recent questions list, and a field notes sidebar with the latest 3 notes.
- R2. **Question Archive** (`/archive`) lists all published Q&As grouped by month, with expandable inline answers, a question count, and a topic filter bar.
- R3. **Field Notes** (`/notes`) lists longer-form posts with a featured first entry (large format) and compact rows below, with a topic filter bar.
- R4. **Individual Field Note** pages for reading full posts.
- R5. **About** (`/about`) page with three cards: About Me, About This Place, and Currently (a regularly updated "now" section).
- R6. **Getting Started** (`/start`) page — content TBD, likely an orientation for new visitors.
- R7. **Daily AI workflow**: a scheduled agent that scans AI news/sources, synthesizes 3–5 question/answer candidates for the day, and surfaces them for the owner to review and pick one to publish. Questions should be foundational or timely — things that are easy to assume you understand, but harder to answer explicitly when asked. "When does X become Y?" is one example style, not a strict template.
- R8. **Admin/publishing interface**: a simple way for the owner to review AI-generated Q&A candidates, select one, edit if needed, and publish it as the day's question.
- R9. **Field Notes CMS**: a simple way to write and publish longer-form notes with a tag/topic.
- R10. Design must faithfully implement the existing mockup design system: stone/forest/sage palette, Bricolage Grotesque + DM Sans + Fira Code + Newsreader + Caveat typography, editorial feel.

## Success Criteria

- Owner can publish a daily question in under 5 minutes, mostly by reviewing and selecting from AI suggestions
- Site is live at askdumbquestions.ai and loads fast
- Design matches the mockups
- The daily workflow runs automatically and delivers candidates without manual triggering

## Scope Boundaries

- No user accounts, comments, or social features
- No email newsletter (not yet — keep it out of v1)
- No search
- The AI daily workflow generates *candidates*, not auto-publishes — owner always approves

## Key Decisions

- **"When does X" framing is intentional**: questions are threshold questions, not definitional ones — this should inform how the AI workflow generates candidates
- **Voice**: the site is positioned as an authority on learning and navigating — not a fake expert in a nascent and evolving field. The "not an expert" framing is a contrast to the absurd fake-expertise culture around AI.
- **Field Notes are manually written**: no AI drafting for field notes in v1, only for daily Q&As

## Dependencies / Assumptions

- Domain `askdumbquestions.ai` is owned or will be acquired
- The AI workflow will use Claude (Anthropic) as the underlying model for generating Q&A candidates
- Sources for the daily workflow need to be identified (e.g. AI newsletters, arXiv papers, Hacker News, specific podcasts/blogs)

## Outstanding Questions

### Resolve Before Planning
*(none — all blocking questions resolved)*

### Deferred to Planning
- [Affects R7][Needs research] What sources should the daily agent monitor, and how should they be fetched (RSS, scraping, API)?
- [Affects R8][Technical] How should the admin interface be implemented — separate admin route, headless CMS, or something else?
- [Affects R6][User decision] What should the Getting Started page actually say?

## Tech Stack Decision

- **Framework**: Next.js (App Router)
- **Hosting**: Vercel
- **Database**: TBD in planning (likely Vercel Postgres or PlanetScale for Q&A/notes storage)
- **Daily agent**: Vercel Cron + Claude API
- **Auth for admin**: TBD in planning (NextAuth or simple token-gated route)

## Next Steps
→ `/ce:plan`
