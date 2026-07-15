import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  matchCohortTitle,
  matchRegisterTitle,
  resolveCsvUrl,
  parseNameRows,
  dominantGenders,
  cohortTotals,
  buildNameCounts,
  joinRegisterCounts,
  type Gender,
  type YearRows,
  type NameRow,
} from "./lib/pesel.ts";

const API = "https://api.dane.gov.pl/1.4";
const COHORT_DATASET_ID = "219";
const REGISTER_DATASET_ID = "1667";

interface ApiResource {
  id: string;
  attributes: {
    title: string;
    format: string;
    csv_download_url: string | null;
    link: string;
  };
}

async function fetchResources(datasetId: string): Promise<ApiResource[]> {
  const res = await fetch(`${API}/datasets/${datasetId}/resources?page=1&per_page=100`);
  if (!res.ok) {
    throw new Error(`Failed to fetch resources for dataset ${datasetId}: ${res.status}`);
  }
  const body = (await res.json()) as { data: ApiResource[] };
  return body.data;
}

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CSV ${url}: ${res.status}`);
  return res.text();
}

function csvUrlOf(resource: ApiResource): string {
  return resolveCsvUrl({
    csvDownloadUrl: resource.attributes.csv_download_url,
    link: resource.attributes.link,
  });
}

interface MatchedCohort {
  resource: ApiResource;
  gender: Gender;
  year: number;
}

function dedupeCohortResources(matched: MatchedCohort[]): MatchedCohort[] {
  const byKey = new Map<string, MatchedCohort>();
  for (const m of matched) {
    const key = `${m.year}|${m.gender}`;
    const existing = byKey.get(key);
    const isBetter =
      !existing ||
      (existing.resource.attributes.format !== "xlsx" && m.resource.attributes.format === "xlsx");
    if (isBetter) byKey.set(key, m);
  }
  return [...byKey.values()];
}

interface MatchedRegister {
  resource: ApiResource;
  gender: Gender;
  date: string;
}

function latestRegisterResources(matched: MatchedRegister[]): MatchedRegister[] {
  const byGender = new Map<Gender, MatchedRegister>();
  for (const m of matched) {
    const existing = byGender.get(m.gender);
    if (!existing || m.date > existing.date) byGender.set(m.gender, m);
  }
  return [...byGender.values()];
}

async function main() {
  const cohortResources = await fetchResources(COHORT_DATASET_ID);
  const matchedCohort: MatchedCohort[] = [];
  for (const resource of cohortResources) {
    const m = matchCohortTitle(resource.attributes.title);
    if (m) matchedCohort.push({ resource, ...m });
  }
  const dedupedCohort = dedupeCohortResources(matchedCohort);

  const yearBuckets = new Map<number, NameRow[]>();
  const cohortSources: Array<{ id: string; url: string }> = [];
  for (const { resource, year } of dedupedCohort) {
    const url = csvUrlOf(resource);
    cohortSources.push({ id: resource.id, url });
    const rows = parseNameRows(await fetchCsv(url));
    const bucket = yearBuckets.get(year) ?? [];
    bucket.push(...rows);
    yearBuckets.set(year, bucket);
  }
  const rowsByYear: YearRows[] = [...yearBuckets.entries()].map(([year, rows]) => ({ year, rows }));

  const dominant = dominantGenders(rowsByYear);
  const totals = cohortTotals(rowsByYear);
  const nameCounts = buildNameCounts(rowsByYear, dominant);

  const registerResources = await fetchResources(REGISTER_DATASET_ID);
  const matchedRegister: MatchedRegister[] = [];
  for (const resource of registerResources) {
    const m = matchRegisterTitle(resource.attributes.title);
    if (m) matchedRegister.push({ resource, ...m });
  }
  const latestRegister = latestRegisterResources(matchedRegister);

  const registerRows: NameRow[] = [];
  const registerSources: Array<{ id: string; url: string }> = [];
  for (const { resource } of latestRegister) {
    const url = csvUrlOf(resource);
    registerSources.push({ id: resource.id, url });
    registerRows.push(...parseNameRows(await fetchCsv(url)));
  }

  const joined = joinRegisterCounts(nameCounts, registerRows);
  const names = [...joined.entries()]
    .map(([name, entry]) => ({
      name,
      gender: entry.gender,
      counts: entry.counts,
      registerCount: entry.registerCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const latestYear = Math.max(...rowsByYear.map((y) => y.year));
  const deckSize = names.filter((n) => (n.counts[latestYear] ?? 0) >= 50).length;

  const output = {
    fetchedAt: new Date().toISOString(),
    sources: { cohorts: cohortSources, register: registerSources },
    cohorts: totals,
    names,
  };

  const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "names.json");
  await writeFile(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(
    `Matched ${dedupedCohort.length} cohort resources + ${latestRegister.length} register resources.`,
  );
  console.log(`Wrote ${names.length} names to data/names.json.`);
  console.log(`Deck size (latest cohort count >= 50): ${deckSize}.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
