# The List tab virtualizes its rows with @tanstack/react-virtual

The List tab (#7) is the only place all 3,544 Names are visible at once — the Deck only ever
deals ~353. Search and the gender/popularity filters narrow that down in the common case, but
the unfiltered view still has to render all 3,544 rows.

We added `@tanstack/react-virtual` rather than mapping the filtered array straight into JSX.
It's a small, headless dependency (no imposed styling, works fine with Tailwind) that only
mounts the rows currently in the scrollport, keeping the DOM node count roughly constant
regardless of how many Names match the current filter.

## Consequences

This is the one new runtime dependency this feature needed; everything else (search, filtering,
sorting) is plain array operations in `src/lib/list.ts`. If the row count ever shrinks
substantially (e.g. filters get much more aggressive, or the dataset itself shrinks), this
dependency could be revisited — but at 3,544 rows on phone-class hardware it earns its keep.
