import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureSchema, getSql } from "../src/lib/db.ts";
import { chunk, latestCountOf, buildNamesUpsertQuery, buildCohortsUpsertQuery } from "./lib/seed.ts";
import type { Gender } from "./lib/pesel.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "names.json");
const NAMES_CHUNK_SIZE = 300;

interface NamesFile {
  cohorts: { year: number; gender: Gender; total: number }[];
  names: {
    name: string;
    gender: Gender;
    counts: Record<string, number>;
    registerCount: number;
  }[];
}

async function main() {
  await ensureSchema();
  const sql = getSql();

  const raw = await readFile(DATA_PATH, "utf8");
  const data = JSON.parse(raw) as NamesFile;

  const nameRows = data.names.map((entry) => ({
    name: entry.name,
    gender: entry.gender,
    counts: entry.counts,
    latestCount: latestCountOf(entry.counts),
    registerCount: entry.registerCount,
  }));

  for (const rowsChunk of chunk(nameRows, NAMES_CHUNK_SIZE)) {
    const { text, params } = buildNamesUpsertQuery(rowsChunk);
    await sql.query(text, params);
  }

  const { text, params } = buildCohortsUpsertQuery(data.cohorts);
  await sql.query(text, params);

  console.log(`Upserted ${nameRows.length} names and ${data.cohorts.length} cohorts.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
