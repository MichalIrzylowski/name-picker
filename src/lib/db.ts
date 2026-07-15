import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

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
