# Start here — context for a fresh machine or a fresh session

Read this first. It is the things about MyMenu that are true but not obvious
from reading the code, written down so a new session does not have to rediscover
them.

## What this is

MyMenu — a QR-menu and ordering product for restaurants in the UAE, built as a
university assignment that ends in a live demo and an investor-style pitch.
Prices are AED, stored as integer fils (minor units) — never floats.

Next.js 16 + React 19 + Tailwind 4 + Supabase. Supabase project ref
`nzlperbhsqvaudpruvra`.

Work is tracked in `docs/sprint-status.yaml` against `docs/epics.md`. Nearly
every story is at `review`. The one real remaining gap is story 7-2: Arabic
exists on the diner-facing menu, but the owner pages written after Epic 6
(`/menu`, `/customers`, `/team`, `/settings`, `/history`) hardcode English
instead of using `lib/i18n`.

## Getting it running

```
git clone https://github.com/animalchicken57-ux/mymenu.git
cd mymenu
npm install
npm run dev
```

`.env.local` is **gitignored and does not come with the clone.** Without it
nothing runs. It needs six variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
SUPPORT_INBOX
```

The values are in the Vercel dashboard under Settings → Environment Variables.
Copy them from there rather than guessing.

## Migrations are applied by hand

There is no Supabase CLI, no `supabase/config.toml`, and no database password or
access token on any of these machines — only the PostgREST keys, which cannot
run DDL.

So **a new file in `supabase/migrations/` does nothing until someone personally
pastes it into the Supabase dashboard SQL Editor and clicks Run.** Writing the
`.sql` file is half the job. Always verify a migration actually landed before
assuming the schema matches the code.

Cheap non-destructive probe — call the changed RPC with a slug that does not
exist and read the error:

- `PGRST202 / not found in schema cache` → never applied
- `P0001 restaurant_not_found` → it is live

## Checking things work

`node scripts/order-flow-test.mjs <label>` runs the whole order path against the
live database and is the fastest end-to-end check. Pass a fresh label every run
— it creates `flow-<label>@mymenu-test.com` and slug `flow-test-<label>`.

`npm run lint` has **pre-existing failures** (React 19 compiler rules:
setState-in-effect, `Date.now()` during render). They do not break the Vercel
build, because Next 16 no longer lints during `next build`. Do not panic at
them and do not treat fixing them as part of an unrelated task.

**After any push, check the commit status on GitHub rather than assuming.**
Every build from `0c1ea52` to `76b3ebb` failed and nobody noticed, because the
live site kept serving the last good build — four commits of work looked shipped
and were not. `tsc --noEmit` cannot see this class of failure; it happens at
page-data collection. Run a real `npm run build` before pushing.

## The demo

Live at `https://mymenu-the-project3.vercel.app` (also aliased as
`mymenu-mzk5.vercel.app` — quote the first one).

- `/` — the landing page, for restaurant owners
- `/slides.html` — the pitch deck, 12 slides
- `/r/al-reem-grill` — the customer menu. **This is the one to demo.** 19 seeded
  dishes, all photographed, with a month of orders behind it.
- `/kitchen` — the kitchen screen, needs a sign-in
- `/r/falafel-hut` — a second restaurant built by hand on a separate account
  (mango juice, Fanta, French fries). **No order history, so its dashboard reads
  0 AED.** Do not demo with this one; confusing the two has cost time before.

Also served, all `noindex`: `/script.html`, `/cheatsheet.html`, and
`/MyMenu-Presentation-Script.docx`.

"The customer page" always means the dark diner-facing menu at `/r/[slug]` —
never the owner's `/customers` list.

## The pitch

Presented Thursday 20 August 2026. `docs/presentation-brief.md` maps the
instructor's seven required points to their slides. The point pressed hardest
on was **the target segment, stated specifically** — age, gender, interests,
what they already buy — and explicitly not "this is for everyone".

**Money figures appear in seven places**: `public/slides.html`,
`public/script.html`, `public/cheatsheet.html`, the three PDFs, the .docx, and
`docs/business-case.md`. Change one, change all of them — an investor who adds
up the slide and the document and gets two answers stops trusting the rest.
PDFs regenerate through Edge headless print, the .docx through Word COM.

`docs/pitch.html`, `docs/script.html` and `docs/cheat-sheet.html` are **stale
duplicates** of the `public/` versions and are not served. They should be
deleted so nobody presents from the wrong one.

## Working style

Explain in plain numbered steps, not jargon. Recommend one path rather than
listing options. The laptop this was built on has 3.8 GB of RAM — run one dev
server at a time and kill orphaned node processes by hand, or Next.js dies with
a confusing Turbopack panic.
