import type { Gender, NameApiItem, Popularity } from "./names.ts";

export type GenderFilter = "all" | Gender;
export type PopularityFilter = "all" | Popularity;

const DIACRITICS: Record<string, string> = {
  Ą: "A",
  Ć: "C",
  Ę: "E",
  Ł: "L",
  Ń: "N",
  Ó: "O",
  Ś: "S",
  Ź: "Z",
  Ż: "Z",
};

export function normalizeForSearch(value: string): string {
  return value.toUpperCase().replace(/[ĄĆĘŁŃÓŚŹŻ]/g, (ch) => DIACRITICS[ch] ?? ch);
}

export function matchesSearch(name: NameApiItem, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return normalizeForSearch(name.name).includes(normalizeForSearch(trimmed));
}

export function matchesGender(name: NameApiItem, filter: GenderFilter): boolean {
  return filter === "all" || name.gender === filter;
}

export function matchesPopularity(name: NameApiItem, filter: PopularityFilter): boolean {
  return filter === "all" || name.popularity === filter;
}

export interface ListFilters {
  search: string;
  genderFilter: GenderFilter;
  popularityFilter: PopularityFilter;
}

export function filterNames(names: NameApiItem[], filters: ListFilters): NameApiItem[] {
  return names.filter(
    (n) =>
      matchesSearch(n, filters.search) &&
      matchesGender(n, filters.genderFilter) &&
      matchesPopularity(n, filters.popularityFilter),
  );
}

const collator = new Intl.Collator("pl");

/** Alphabetical order per ADR-backed decision: Polish collation, not codepoint order. */
export function sortAlphabetically(names: NameApiItem[]): NameApiItem[] {
  return names.slice().sort((a, b) => collator.compare(a.display, b.display));
}
