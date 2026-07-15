import type { Gender } from "./pesel.ts";

export interface NameSeedRow {
  name: string;
  gender: Gender;
  counts: Record<string, number>;
  latestCount: number;
  registerCount: number;
}

export interface CohortSeedRow {
  year: number;
  gender: Gender;
  total: number;
}

export interface UpsertQuery {
  text: string;
  params: unknown[];
}

export function latestCountOf(counts: Record<string, number>): number {
  const latestYear = Math.max(...Object.keys(counts).map(Number));
  return counts[String(latestYear)];
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function valuesClause(rowCount: number, columnsPerRow: number): string {
  const rows: string[] = [];
  for (let row = 0; row < rowCount; row++) {
    const offset = row * columnsPerRow;
    const placeholders = Array.from({ length: columnsPerRow }, (_, col) => `$${offset + col + 1}`);
    rows.push(`(${placeholders.join(",")})`);
  }
  return rows.join(", ");
}

export function buildNamesUpsertQuery(rows: NameSeedRow[]): UpsertQuery {
  const params = rows.flatMap((row) => [
    row.name,
    row.gender,
    JSON.stringify(row.counts),
    row.latestCount,
    row.registerCount,
  ]);

  const text = `
    INSERT INTO names (name, gender, counts, latest_count, register_count)
    VALUES ${valuesClause(rows.length, 5)}
    ON CONFLICT (name) DO UPDATE SET
      gender = excluded.gender,
      counts = excluded.counts,
      latest_count = excluded.latest_count,
      register_count = excluded.register_count
  `;

  return { text, params };
}

export function buildCohortsUpsertQuery(rows: CohortSeedRow[]): UpsertQuery {
  const params = rows.flatMap((row) => [row.year, row.gender, row.total]);

  const text = `
    INSERT INTO cohorts (year, gender, total)
    VALUES ${valuesClause(rows.length, 3)}
    ON CONFLICT (year, gender) DO UPDATE SET
      total = excluded.total
  `;

  return { text, params };
}
