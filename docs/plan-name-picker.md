# Implement "Wybieramy imię" (baby name picker) from Claude Design

## Context

The user has a Claude Design file (`Wybieramy imię.dc.html`, project
`cc5d1c20-2f35-4e01-bb7a-a7d0e65fbfb5`, readable via DesignSync) describing a family
baby-name-voting PWA-style app, in Polish. It's a single declarative `.dc.html` component
(custom `sc-if`/`sc-for`/`{{ }}` templating + a `DCLogic` class) that needs to be translated
into this repo's stack: Next.js App Router + Tailwind v4 + TypeScript, per
[CLAUDE.md](./CLAUDE.md). `src/app/page.tsx` is still create-next-app boilerplate, so this is
greenfield work.

The design covers: an onboarding "who are you" device-identity screen, a Tinder-style
swipe-to-vote card deck, a filterable/searchable list view, a "shared picks" view showing
names the chosen family members agree on, and a family-management tab. All copy is Polish;
keep it Polish (no i18n framework — it's a single-family app).

**The design's 28 hardcoded names are not the real data source.** Names come from Poland's
open PESEL data on `dane.gov.pl`. A fetch script pulls them into a committed file, a seed
script loads that file into Neon. The design's `NAMES` array is a mock — it is replaced
entirely, and two of its card fields turn out to be unsourceable (see ADR 0003).

Domain vocabulary is in [CONTEXT.md](./CONTEXT.md) — in particular **Cohort count** (babies
given a name in one year) vs **Register count** (living people bearing it), which are
different numbers that disagree, and whose conflation is an active bug source.

Three decisions are recorded as ADRs because they are surprising from inside the code and a
reader would otherwise "fix" them:

- [ADR 0001](./docs/adr/0001-two-pesel-datasets.md) — two PESEL datasets, joined on (name, gender)
- [ADR 0002](./docs/adr/0002-trend-from-share-not-counts.md) — Trend from share of cohort, not raw counts
- [ADR 0003](./docs/adr/0003-no-etymology-or-name-days.md) — the card drops Pochodzenie and Imieniny

## The data (verified against live API, 2026-07-15)

`api.dane.gov.pl/1.4` — JSON:API, no key, no auth.

| | Dataset **219** — cohorts | Dataset **1667** — register |
|---|---|---|
| Answers | "is this name fashionable now?" | "how many bear this name?" |
| Drives | Deck, Popularity, Trend | the card's "W Polsce" only |
| Latest | 2025 cohorts (published 2026-01-20) | snapshot 2026-01-20 |
| Volume | ~965 M + ~939 F per year | 46,202 M + 28,786 F |

Facts established by probing the API — each one bit during research, so don't rediscover them:

- **Resource discovery, not hardcoded IDs.** Filter dataset 219's resource titles on
  `Imiona (męskie|żeńskie) nadane dzieciom w Polsce w (\d{4}) r. - imię pierwsze`, excluding
  `wg województw` / `wg USC` / `imię drugie`. Matches 14 resources across 2019–2025.
- **2019 is uploaded twice** — once native CSV (21453/21455), once XLSX (21454/21456), same
  data, identical titles. Dedupe by (year, gender).
- **Pick the URL by format.** XLSX resources expose an auto-generated `csv_download_url`;
  native-CSV resources have `csv_download_url: null` and their `/csv` endpoint returns
  **empty** — fall back to `link`.
- **Parse CSV positionally.** 2022's header is `IMIĘ PIERWSZE,PŁEĆ,LICZBA WYSTĄPIENIEŃ` —
  spaces not underscores, plus a typo in the government's own column name. Every other year
  uses `IMIĘ_PIERWSZE,PŁEĆ,LICZBA_WYSTĄPIEŃ`. Column-name lookup breaks on exactly one year.
- **No CSV library needed.** Zero quoted fields, zero embedded commas, zero malformed rows
  across all 16 files. `split(',')` is sufficient. No xlsx library either — we only ever
  fetch the CSV endpoints.
- **Gender is dominant-gender, not composite key.** 23 names carry both genders across
  2019–2025, but the ambiguity is registration noise (ALEKSANDER 43,199 M / 2 F) at the top
  and sub-30-count genuine unisex (MICHEL 3/3, RILEY 2/2) at the bottom — nothing is both
  popular and ambiguous. Each Name takes the gender it was given more often, total.
- **The register join must be keyed on (name, dominant gender).** Merging the two register
  files on name alone lets noise clobber real values: `JAN` becomes 14 instead of 462,503.
  Coverage is 100% — all 3,544 names exist in the register under their dominant gender, so
  no missing-data branch is needed.
- **Births fell 36.5%** across the window (387,691 → 246,192), which is why Trend is
  share-based. See ADR 0002.

## Key design decisions

1. **Pipeline: fetch → committed file → seed → Neon.** The file is the decoupling point and
   is committed (~200KB): seeding works offline and reproducibly, the yearly refresh is a
   reviewable diff, and an upstream change can't silently alter what gets seeded.
2. **Scripts are plain `.ts` run directly by Node 24** (`node scripts/fetch-names.ts`) —
   native type stripping, native `fetch`, no CSV/xlsx lib. **Zero new devDependencies.**
   `/usr/local/bin/node` on this machine is v20 and cannot strip types (it fails loudly with
   a syntax error), so pin with `.nvmrc` (`24`) + `package.json` `engines.node: ">=22.6"`.
3. **The script is a dumb mirror.** It writes raw Cohort counts and never derived fields.
   Trend and Popularity are product rules that will change; they live in TS, so changing
   one's mind is a code edit, never a re-fetch.
4. **Deck = latest Cohort count ≥ 50** (353 names: 175 M / 178 F), narrowed by the family's
   gender scope. **All 3,544 names stay searchable** via the list tab — the floor limits what
   is *offered*, never what can be voted on, so great-grandma's rare name is still reachable.
5. **Popularity bands derive from the latest Cohort count**: ≥1000 *bardzo popularne* (68),
   ≥250 *popularne* (93), ≥50 *umiarkowane* (192), below *rzadko nadawane* (3,191). The
   bottom band is exactly "not in the Deck" — one threshold defines both, so the list chips
   and the deck can never disagree. (The design's own `cat` labels were hand-written vibes
   and contradict the data — it tags Jadwiga and Henryk *rzadko nadawane*, where 2025 says
   268 and 985 babies. Ignore them.)
6. **Trend**: share(latest) vs share(latest − 3), ±15% → `up`/`down`/`stable`; undefined when
   the latest Cohort count < 25; a name absent 3 years ago but real now counts as `up`. See
   ADR 0002.
7. **Seeding is upsert-only, never delete**, and the fetch window grows (2026 just appends
   next January). Names only accumulate, so an upstream change can never cascade-delete a
   family's votes — the only irreplaceable data in the app. "Latest cohort" auto-advances.
8. **Uppercase is identity.** `names.name = 'NIKODEM'` is the PK and the FK target; a
   `displayName()` helper renders `Nikodem`. Naive title-casing is correct for every Polish
   name (Ł/Ż/Ś/Ć/Ó all fine) and there are no hyphenated names in the data.
9. **DB holds names + the family's mutable state**: `names`, `cohorts`, `participants`,
   `votes`, `notes`, `settings` (holds `surname`). Seed the family tables **empty** — no fake
   demo participants in production; the real family adds themselves via the existing
   "Jestem kimś innym" onboarding, which already handles an empty profile list.
10. **No auth.** Private family app; whoever has the link can vote as any profile they pick.
    Matches the design.
11. **Trend/Popularity are derived server-side**, and the client receives a lean per-Name
    view (`name, gender, popularity, trend, registerCount`). Raw `counts` and cohort totals
    never reach the browser. This keeps ADR 0002's rule in code while keeping the payload
    small. The field is named `popularity`, not `cat` — CONTEXT.md's glossary explicitly
    lists `cat` under Popularity's *Avoid*. `trend` is omitted entirely (not `null`) for
    names below the 25-count floor.
12. **Names are fetched once and cached; only family state is polled.** Names change only on
    re-seed. Do *not* return 3,544 names from the polled endpoint.
13. **Polling, not websockets** — the client refetches `/api/state` every few seconds while
    the tab is visible (paused when hidden).
14. **`matchRule`, `listSort` and `demoVotes` are design-tool preview props, not app
    features** — none has UI in the design. Hardcode the design's defaults: match = every
    selected Participant voted ❤️; sort = `alfabetycznie`; no demo votes.
15. **Anyone can be removed.** The design's `canRemove: i >= 2` existed only to protect the
    seeded demo rows; with empty seeding it would permanently protect the first two real
    people. Drop it. Removing yourself returns you to onboarding.
16. **Lazy, idempotent schema setup** — `db.ts` runs `CREATE TABLE IF NOT EXISTS` for all
    tables on first query per cold start (memoized). Fits CLAUDE.md's "no enterprise rigor".
17. **Fonts**: replace Geist/Geist Mono in `layout.tsx` with the design's, via
    `next/font/google`: Fraunces (variable, ital+opsz+wght), Work Sans (400/500/600/700),
    IBM Plex Mono (400/500/600).

## Deviations from the design, and why

- **Card drops Pochodzenie and Imieniny** (ADR 0003) — unsourceable. The field grid
  recomposes around gender pill, name (+surname), W Polsce, Trend. The list row's `meta`
  drops its *imieniny* segment.
- **Two POOLs, not one.** The design derives deck, list and shared from a single `POOL`. The
  Deck draws from the 353 above the floor; list/search **and shared** must see all 3,544 —
  otherwise a name found via search and loved by everyone could never appear in *Wasze
  wspólne typy*.
- **`progress` denominator is the Deck** (353), not all names — the design's
  `${rated} z ${NAMES.length}` would read "12 z 3544" forever.
- **Participant colours**: the design's `EXTRA_COLORS[(len - 3 + 5) % 5]` assumes three
  seeded participants; with an empty table the first joiner gets `EXTRA_COLORS[2]` and the
  design's three signature colours (`#F2A31B`, `#D9482B`, `#4C7FB8` — used throughout the
  UI) are never assigned to anyone. Assign from `[#F2A31B, #D9482B, #4C7FB8, ...EXTRA_COLORS]`
  by join order.

## Files to add/change

**Scripts & data**

- `scripts/fetch-names.ts` — discovers resources in datasets 219 + 1667, downloads CSVs,
  parses positionally, resolves dominant gender, joins register counts on (name, gender),
  writes `data/names.json`. Reports what it did (resources matched, names written, deck size).
- `data/names.json` (committed) —
  ```jsonc
  {
    "fetchedAt": "2026-07-15",
    "sources": { "cohorts": [/* resource ids+urls */], "register": [/* … */] },
    "cohorts": { "2019-M": 199134, "2019-F": 188557, /* … */ "2025-F": 119788 },
    "names": [
      { "name": "NIKODEM", "gender": "M",
        "counts": { "2019": 4321, /* … */ "2025": 5772 },
        "registerCount": 77519 }
    ]
  }
  ```
  `counts` holds only the Name's dominant-gender series; minority-gender noise is dropped.
- `scripts/seed-names.ts` — reads the file, upserts `names` + `cohorts`. Never deletes.

**DB**

- `src/lib/db.ts` — Neon serverless driver (`@neondatabase/serverless`, tagged-template
  `sql`), memoized `ensureSchema()`, and query functions: `getNames()`, `getState()`,
  `addParticipant()`, `removeParticipant()`, `castVote()`, `addNote()`, `setSurname()`.
- Schema:
  - `names(name text pk, gender text not null check (gender in ('M','F')), counts jsonb not null, latest_count int not null, register_count int not null)` + index on `(gender, latest_count desc)`. `latest_count` is denormalized from `counts` at seed time so the Deck query can filter and order in SQL without knowing which year is latest.
  - `cohorts(year int, gender text, total int, primary key (year, gender))` — needed to compute Share.
  - `participants(id text pk, name text, color text, created_at timestamptz default now())`
  - `votes(name_id text references names(name), participant_id text references participants(id) on delete cascade, value text check (value in ('love','maybe','no')), primary key (name_id, participant_id))`
  - `notes(id serial pk, name_id text references names(name), author_id text references participants(id) on delete cascade, text text, created_at timestamptz default now())`
  - `settings(key text pk, value text)`

**Domain logic**

- `src/lib/names.ts` — `trendOf(counts, cohorts, gender)`, `popularityOf(latestCount)`,
  `displayName(name)`, and the `TREND` / `EMOJI` / `VOTE_LABEL` display maps ported verbatim
  from the `.dc.html`. Thresholds (50 / 250 / 1000, ±15%, 25, 3-year window) live here as
  named constants.

**API (Route Handlers)**

- `src/app/api/names/route.ts` — `GET`: lean view of all 3,544
  (`{ name, display, gender, popularity, trend, registerCount, inDeck }`), Trend/Popularity
  derived server-side. `trend` omitted for names below the 25-count floor. `dynamic =
  "force-dynamic"` plus a long `Cache-Control` header, not static `revalidate` — static route
  generation would require a live DB connection during `next build`, which this project's
  build environment doesn't guarantee.
- `src/app/api/state/route.ts` — `GET`: `{ participants, votes, notes, surname }` only.
  Votes/notes shaped as nested maps mirroring the design's `SEED_VOTES`/`SEED_NOTES` so the
  client logic ports directly. This is the polled endpoint — **no names**.
- `src/app/api/participants/route.ts` — `POST`; `src/app/api/participants/[id]/route.ts` — `DELETE`.
- `src/app/api/votes/route.ts` — `POST { nameId, participantId, value }`.
- `src/app/api/notes/route.ts` — `POST { nameId, authorId, text }`.
- `src/app/api/settings/route.ts` — `POST { surname }`.

**UI** (client components under `src/components/name-picker/`, ported 1:1 from the `.dc.html`
template/logic, restyled with Tailwind + a few inline styles for dynamic colours)

- `use-name-picker.ts` — hook holding: local UI state (tab, filters, swipe animation,
  note/switch-profile toggles), `currentUserId` synced to `localStorage`, names (fetched
  once) + family state (polled), and mutation callbacks (optimistic update + POST). Mirrors
  the design's `renderVals()` computed-values approach.
- `NamePickerApp.tsx` — root; renders `Onboarding` or the main shell.
- `Onboarding.tsx`, `Header.tsx`, `BottomNav.tsx`
- `SwipeTab.tsx` (card + swipe buttons + note editor), `ListTab.tsx`, `SharedTab.tsx`,
  `FamilyTab.tsx`
- `src/app/page.tsx` — replaced with `<NamePickerApp />`.
- `src/app/layout.tsx` — swap fonts, `metadata.title` "Wybieramy imię", `lang="pl"`.
- `src/app/globals.css` — page background `#0F3B2E`, link colours, input placeholder/focus
  rules from the design's `<style>` block.

**Config**

- `package.json` — add `@neondatabase/serverless`; `engines.node`; scripts `fetch-names`,
  `seed-names`.
- `.nvmrc` — `24`.
- `.env.example` — `DATABASE_URL=` with a comment pointing at Vercel's Neon integration /
  `vercel env pull`.

## Verification

- `npm run fetch-names` — assert 14 cohort resources + 2 register resources matched, 3,544
  names written, 353 in deck, and spot-check that `JAN.registerCount == 462503` (not 14) and
  `ADA.trend == 'up'` (not 'down' or 'stable'). These two are the regression tests for the
  join and the share bug respectively. (LAURA, ADR 0002's illustrative example, is not a
  usable regression case here — its real 2019-2025 trajectory peaked in 2021 and has declined
  every year since, so the literal 3-year trend window correctly reports it `stable`; the
  ADR's "+52.7%" figure is a 2019-vs-2025 comparison, a different question from the product's
  3-year window.)
- `npm run lint` and `npm run build` must pass.
- `npm run dev`, walk the golden path: onboarding → add/pick a profile → swipe a card in all
  3 directions → list tab filters/search, including searching for a name *outside* the deck
  and voting on it → shared tab with 2+ participants matching (confirm the searched-for rare
  name can appear there) → family tab add/remove participant, set surname, verify card footer
  updates.
- **Caveat**: everything from the seed step onward needs a real `DATABASE_URL` (Neon
  connection string), which I don't have — the user provisions the Neon integration on Vercel
  (or a local Neon branch) and sets it. `db.ts` surfaces a clear startup error if unset rather
  than silently falling back. Steps 1–2 (fetch → file) are fully runnable and verifiable
  without it.

## Open / unverified

- The ±15% Trend bands and the 1000/250/50 Popularity thresholds are judgement calls, not
  derived — eyeball the real output and move the constants in `src/lib/names.ts` once you see
  which names land where.
- The card's recomposed 4-field grid has not been rendered — the layout change from dropping
  two fields is unreviewed.
- The Deck floor is absolute, so as Polish births keep falling the Deck will slowly shrink on
  its own (353 today). Revisit if it becomes noticeable; rank-based bands were the considered
  alternative.
