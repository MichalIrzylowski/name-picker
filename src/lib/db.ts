import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { CohortTotal, Gender, NameRecord } from "./names.ts";
import { colorForJoinOrder } from "./participants.ts";

export type VoteValue = "love" | "maybe" | "no";

export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface FamilyState {
  participants: Participant[];
  votes: Record<string, Record<string, VoteValue>>;
  notes: Record<string, { authorId: string; text: string }[]>;
  surname: string;
}

let sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (sql) return sql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in " +
        "(e.g. via `vercel env pull .env.local`).",
    );
  }

  sql = neon(connectionString);
  return sql;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = createSchema().catch((err: unknown) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function createSchema(): Promise<void> {
  const dbSql = getSql();

  await dbSql`
    CREATE TABLE IF NOT EXISTS names (
      name text PRIMARY KEY,
      gender text NOT NULL CHECK (gender IN ('M', 'K')),
      counts jsonb NOT NULL,
      latest_count int NOT NULL,
      register_count int NOT NULL
    )
  `;
  await dbSql`
    CREATE INDEX IF NOT EXISTS names_gender_latest_count_idx
      ON names (gender, latest_count DESC)
  `;

  await dbSql`
    CREATE TABLE IF NOT EXISTS cohorts (
      year int,
      gender text,
      total int,
      PRIMARY KEY (year, gender)
    )
  `;

  await dbSql`
    CREATE TABLE IF NOT EXISTS participants (
      id text PRIMARY KEY,
      name text,
      color text,
      created_at timestamptz DEFAULT now()
    )
  `;

  await dbSql`
    CREATE TABLE IF NOT EXISTS votes (
      name_id text REFERENCES names(name),
      participant_id text REFERENCES participants(id) ON DELETE CASCADE,
      value text CHECK (value IN ('love', 'maybe', 'no')),
      PRIMARY KEY (name_id, participant_id)
    )
  `;

  await dbSql`
    CREATE TABLE IF NOT EXISTS notes (
      id serial PRIMARY KEY,
      name_id text REFERENCES names(name),
      author_id text REFERENCES participants(id) ON DELETE CASCADE,
      text text,
      created_at timestamptz DEFAULT now()
    )
  `;

  await dbSql`
    CREATE TABLE IF NOT EXISTS settings (
      key text PRIMARY KEY,
      value text
    )
  `;
}

export async function getNames(): Promise<{ names: NameRecord[]; cohorts: CohortTotal[] }> {
  await ensureSchema();
  const dbSql = getSql();

  const [nameRows, cohortRows] = await Promise.all([
    dbSql`SELECT name, gender, counts, latest_count, register_count FROM names`,
    dbSql`SELECT year, gender, total FROM cohorts`,
  ]);

  const names: NameRecord[] = nameRows.map((row) => ({
    name: row.name as string,
    gender: row.gender as Gender,
    counts: row.counts as Record<string, number>,
    latestCount: row.latest_count as number,
    registerCount: row.register_count as number,
  }));

  const cohorts: CohortTotal[] = cohortRows.map((row) => ({
    year: row.year as number,
    gender: row.gender as Gender,
    total: row.total as number,
  }));

  return { names, cohorts };
}

export async function getState(): Promise<FamilyState> {
  await ensureSchema();
  const dbSql = getSql();

  const [participantRows, voteRows, noteRows, settingsRows] = await Promise.all([
    dbSql`SELECT id, name, color FROM participants`,
    dbSql`SELECT name_id, participant_id, value FROM votes`,
    dbSql`SELECT name_id, author_id, text FROM notes ORDER BY id`,
    dbSql`SELECT value FROM settings WHERE key = 'surname'`,
  ]);

  const participants: Participant[] = participantRows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
  }));

  const votes: FamilyState["votes"] = {};
  for (const row of voteRows) {
    const nameId = row.name_id as string;
    (votes[nameId] ??= {})[row.participant_id as string] = row.value as VoteValue;
  }

  const notes: FamilyState["notes"] = {};
  for (const row of noteRows) {
    const nameId = row.name_id as string;
    (notes[nameId] ??= []).push({ authorId: row.author_id as string, text: row.text as string });
  }

  const surname = (settingsRows[0]?.value as string | undefined) ?? "";

  return { participants, votes, notes, surname };
}

export async function addParticipant(name: string): Promise<Participant> {
  await ensureSchema();
  const dbSql = getSql();

  const [{ count }] = await dbSql`SELECT COUNT(*)::int AS count FROM participants`;
  const id = crypto.randomUUID();
  const color = colorForJoinOrder(count as number);

  await dbSql`INSERT INTO participants (id, name, color) VALUES (${id}, ${name}, ${color})`;
  return { id, name, color };
}

export async function removeParticipant(id: string): Promise<void> {
  await ensureSchema();
  const dbSql = getSql();
  await dbSql`DELETE FROM participants WHERE id = ${id}`;
}

export async function castVote(
  nameId: string,
  participantId: string,
  value: VoteValue,
): Promise<void> {
  await ensureSchema();
  const dbSql = getSql();
  await dbSql`
    INSERT INTO votes (name_id, participant_id, value)
    VALUES (${nameId}, ${participantId}, ${value})
    ON CONFLICT (name_id, participant_id) DO UPDATE SET value = excluded.value
  `;
}

export async function addNote(nameId: string, authorId: string, text: string): Promise<void> {
  await ensureSchema();
  const dbSql = getSql();
  await dbSql`INSERT INTO notes (name_id, author_id, text) VALUES (${nameId}, ${authorId}, ${text})`;
}

export async function setSurname(surname: string): Promise<void> {
  await ensureSchema();
  const dbSql = getSql();
  await dbSql`
    INSERT INTO settings (key, value)
    VALUES ('surname', ${surname})
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `;
}
