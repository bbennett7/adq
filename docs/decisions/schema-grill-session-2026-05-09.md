# Schema Grill Session — 2026-05-09

Decisions and open questions from the initial schema design session for the questions domain.

## Decisions

### Vector Search — pgvector on Neon (not a separate vector DB)
Embed `question_md + answer_md` concatenated. Store as `embedding vector(1536)` column directly on the `questions` table. Resources and field notes will get their own embedding columns when those domains are built out. A separate vector DB is unnecessary at this scale and adds sync complexity.

### Scheduled Publishing
`published_at` doubles as the scheduling mechanism — set it to a future date to schedule. The display app must filter `AND published_at <= now()` (not just `IS NOT NULL`) in all queries. Both partial indexes need to be rebuilt with this condition.

### Question Numbering — Database Trigger
Number is assigned automatically via a database trigger when `published_at` is first set (whether past or future). The trigger calls `nextval('question_number_seq')`. The admin tool's repo layer is responsible for setting `published_at` values in the correct order when scheduling multiple questions.

### `question_pt` — Keep as Stored Column
Plain text version of the question is stored explicitly rather than derived at render time. The admin tool maintains both fields. Rationale: markdown stripping logic would need to handle all markdown syntax, not just asterisks, making derivation fragile over time.

### Related Questions — None
Questions are not related to each other via an explicit join table. Resources serve the cross-linking purpose.

### Series / Collections — None
Questions are not grouped into series.

### Resources — Canonical per URL
The `UNIQUE` constraint on `resources.url` is correct. A URL always maps to one canonical resource record with one label and one author. Labels do not vary per question context.

### On-Demand Cache Revalidation
The display app exposes a protected `POST /api/revalidate` endpoint, secured by a shared `REVALIDATION_SECRET` env var. When the admin tool publishes or schedules a question, it calls this endpoint, which triggers `revalidatePath('/')` and any relevant tags server-side. This ensures questions go live within seconds of publish rather than waiting for the `cacheLife('hours')` interval to expire on the home page and archive page, or `cacheLife('days')` on individual question pages.

### Email Subscriptions — Third-Party Platform
The display app will pipe signups to an external platform (Beehiiv, ConvertKit, or similar — TBD). No `subscribers` table needed in this database. Platform choice is an open decision.

### Publication Cadence — Monday through Friday
Questions publish on weekdays only. No schema implication, but relevant context for scheduling logic in the admin tool and for ISR/revalidation timing.

### Single Author — No Attribution Table
All questions are written by the site owner. No author or contributor table needed.

### Answer Versioning — Silent In-Place Editing
`answer_md` is updated in place. No revision history. `updated_at` is the only audit trail.

### Question Numbering — Trigger Is Permanent
The trigger assigns a number only when `published_at` changes from `NULL` to non-null AND `number IS NULL`. Un-publishing and re-publishing a question keeps its original number.

### Field Notes — Out of Scope for Now
Field notes are a separate content type that will also have resources attached. Schema design is deferred.

## Open Questions

- **Email platform**: Beehiiv and ConvertKit are leading candidates. Decide when ready to build the signup flow.
- **Embedding model**: Confirmed — OpenAI `text-embedding-3-small`, 1536 dimensions.

## Migration Changes Needed (001_create_questions.sql)

- Add `AND published_at <= now()` to both partial indexes
- Wire up the trigger to assign `number` when `published_at` is first set
- Add `embedding vector(1536)` column to `questions` (requires `pgvector` extension)
- Add `embedding vector(1536)` column to `resources`
