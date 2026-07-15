export type Gender = "M" | "K";

export interface NameRow {
  name: string;
  gender: Gender;
  count: number;
}

export interface YearRows {
  year: number;
  rows: NameRow[];
}

const COHORT_TITLE_RE =
  /^Imiona (męskie|żeńskie) nadane dzieciom w Polsce w (\d{4}) r\. - imię pierwsze$/;

const REGISTER_TITLE_RE =
  /^lista imion (męskich|żeńskich) w rejestrze PESEL stan na (\d{2})\.(\d{2})\.(\d{4}) - imię pierwsze$/;

export function matchCohortTitle(title: string): { gender: Gender; year: number } | null {
  const m = COHORT_TITLE_RE.exec(title);
  if (!m) return null;
  return { gender: m[1] === "męskie" ? "M" : "K", year: Number(m[2]) };
}

export function matchRegisterTitle(title: string): { gender: Gender; date: string } | null {
  const m = REGISTER_TITLE_RE.exec(title);
  if (!m) return null;
  const [, genderWord, dd, mm, yyyy] = m;
  return { gender: genderWord === "męskich" ? "M" : "K", date: `${yyyy}-${mm}-${dd}` };
}

export function resolveCsvUrl(resource: { csvDownloadUrl: string | null; link: string }): string {
  return resource.csvDownloadUrl ?? resource.link;
}

export function parseNameRows(csvText: string): NameRow[] {
  const rows: NameRow[] = [];
  const lines = csvText.trim().split("\n");
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    if (cols.length < 3) continue;
    const name = cols[0].trim();
    const sex = cols[1].trim();
    const count = Number(cols[2].trim());
    if (!name || Number.isNaN(count)) continue;
    rows.push({ name, gender: sex === "MĘŻCZYZNA" ? "M" : "K", count });
  }
  return rows;
}

export function dominantGenders(rowsByYear: YearRows[]): Map<string, Gender> {
  const totals = new Map<string, Record<Gender, number>>();
  for (const { rows } of rowsByYear) {
    for (const { name, gender, count } of rows) {
      const t = totals.get(name) ?? { M: 0, K: 0 };
      t[gender] += count;
      totals.set(name, t);
    }
  }
  const dominant = new Map<string, Gender>();
  for (const [name, t] of totals) {
    dominant.set(name, t.M >= t.K ? "M" : "K");
  }
  return dominant;
}

export function cohortTotals(
  rowsByYear: YearRows[],
): Array<{ year: number; gender: Gender; total: number }> {
  const totals: Array<{ year: number; gender: Gender; total: number }> = [];
  for (const { year, rows } of rowsByYear) {
    const byGender: Record<Gender, number> = { M: 0, K: 0 };
    for (const { gender, count } of rows) byGender[gender] += count;
    for (const gender of ["M", "K"] as const) {
      if (byGender[gender] > 0) totals.push({ year, gender, total: byGender[gender] });
    }
  }
  return totals;
}

export interface NameCounts {
  gender: Gender;
  counts: Record<number, number>;
}

export function buildNameCounts(
  rowsByYear: YearRows[],
  dominant: Map<string, Gender>,
): Map<string, NameCounts> {
  const names = new Map<string, NameCounts>();
  for (const { year, rows } of rowsByYear) {
    for (const { name, gender, count } of rows) {
      if (dominant.get(name) !== gender) continue;
      const entry = names.get(name) ?? { gender, counts: {} };
      entry.counts[year] = count;
      names.set(name, entry);
    }
  }
  return names;
}

export interface JoinedName extends NameCounts {
  registerCount: number;
}

export function joinRegisterCounts(
  names: Map<string, NameCounts>,
  registerRows: NameRow[],
): Map<string, JoinedName> {
  const registerByKey = new Map<string, number>();
  for (const { name, gender, count } of registerRows) {
    registerByKey.set(`${name}|${gender}`, count);
  }
  const joined = new Map<string, JoinedName>();
  for (const [name, entry] of names) {
    const registerCount = registerByKey.get(`${name}|${entry.gender}`) ?? 0;
    joined.set(name, { ...entry, registerCount });
  }
  return joined;
}
