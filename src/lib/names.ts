export type Gender = "M" | "K";
export type Trend = "up" | "down" | "stable";
export type Popularity = "bardzo popularne" | "popularne" | "umiarkowane" | "rzadko nadawane";

/** Latest Cohort count below this is too small for Share to be a meaningful signal. */
export const TREND_MIN_COUNT = 25;
/** Trend compares the latest Cohort's Share against the Cohort this many years earlier. */
export const TREND_WINDOW_YEARS = 3;
/** Share change beyond this magnitude is rosnące/spadające; within it is stabilne. */
export const TREND_BAND = 0.15;

export const POPULARITY_VERY_POPULAR = 1000;
export const POPULARITY_POPULAR = 250;
/** Same threshold as DECK_FLOOR, so the bottom Popularity band and the Deck can never disagree. */
export const POPULARITY_MODERATE = 50;
export const DECK_FLOOR = POPULARITY_MODERATE;

export const TREND: Record<Trend, { glyph: string; label: string; color: string }> = {
  up: { glyph: "↗", label: "coraz popularniejsze", color: "#2F6B52" },
  down: { glyph: "↘", label: "coraz rzadsze", color: "#C24328" },
  stable: { glyph: "→", label: "stabilne", color: "#8A7A5F" },
};

export const EMOJI: Record<"love" | "maybe" | "no", string> = {
  love: "❤️",
  maybe: "🤔",
  no: "❌",
};

export const VOTE_LABEL: Record<"love" | "maybe" | "no", string> = {
  love: "kocha",
  maybe: "waha się",
  no: "odrzuca",
};

export function displayName(name: string): string {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

export function popularityOf(latestCount: number): Popularity {
  if (latestCount >= POPULARITY_VERY_POPULAR) return "bardzo popularne";
  if (latestCount >= POPULARITY_POPULAR) return "popularne";
  if (latestCount >= POPULARITY_MODERATE) return "umiarkowane";
  return "rzadko nadawane";
}

export interface NameRecord {
  name: string;
  gender: Gender;
  counts: Record<string, number>;
  latestCount: number;
  registerCount: number;
}

export interface CohortTotal {
  year: number;
  gender: Gender;
  total: number;
}

export interface NameApiItem {
  name: string;
  display: string;
  gender: Gender;
  popularity: Popularity;
  trend?: Trend;
  registerCount: number;
  inDeck: boolean;
}

export function cohortMapOf(cohorts: CohortTotal[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const cohort of cohorts) {
    map[`${cohort.year}-${cohort.gender}`] = cohort.total;
  }
  return map;
}

export function toApiItem(row: NameRecord, cohortMap: Record<string, number>): NameApiItem {
  const trend = trendOf(row.counts, cohortMap, row.gender);
  return {
    name: row.name,
    display: displayName(row.name),
    gender: row.gender,
    popularity: popularityOf(row.latestCount),
    registerCount: row.registerCount,
    inDeck: row.latestCount >= DECK_FLOOR,
    ...(trend !== undefined ? { trend } : {}),
  };
}

export function trendOf(
  counts: Record<string, number>,
  cohorts: Record<string, number>,
  gender: Gender,
): Trend | undefined {
  // "Latest" is this name's own max year present in counts, not a fixed
  // current year — same convention as seed.ts's latestCountOf, so this stays
  // consistent with the latestCount/inDeck already stored on the row.
  const latestYear = Math.max(...Object.keys(counts).map(Number));
  const latestCount = counts[String(latestYear)];
  if (latestCount < TREND_MIN_COUNT) return undefined;

  const earlierYear = latestYear - TREND_WINDOW_YEARS;
  const earlierCount = counts[String(earlierYear)];
  if (earlierCount === undefined) return "up";

  const latestShare = latestCount / cohorts[`${latestYear}-${gender}`];
  const earlierShare = earlierCount / cohorts[`${earlierYear}-${gender}`];
  const change = (latestShare - earlierShare) / earlierShare;

  if (change > TREND_BAND) return "up";
  if (change < -TREND_BAND) return "down";
  return "stable";
}
