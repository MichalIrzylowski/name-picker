# No ORM or migration tool — idempotent `CREATE TABLE IF NOT EXISTS` on cold start

`src/lib/db.ts` has no migration files and no ORM (Prisma was considered and rejected). Its
`ensureSchema()` runs all six `CREATE TABLE IF NOT EXISTS` statements every cold start,
memoized so it only actually hits Neon once per instance. This is the entire migration
story, per CLAUDE.md's "no enterprise rigor" for a small family app.

## Why not Prisma

Prisma's normal workflow is `prisma migrate dev/deploy` run ahead of deploy, then a
generated client at request time — it doesn't run schema DDL on every cold start. Adopting
it would mean maintaining a separate migration pipeline for a schema that, so far, only ever
grows (`CREATE TABLE IF NOT EXISTS`, never `ALTER`). That's real process for a problem this
app doesn't have yet.

## Consequences

Schema changes (adding a column, a new table) mean editing the `CREATE TABLE` statements
directly — there is no down-migration and no history of intermediate schema states. Fine
while the schema is additive; if a genuine breaking schema change is ever needed (renaming
or dropping a column with live data), this ADR should be revisited.
