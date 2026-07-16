import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterNames,
  matchesGender,
  matchesPopularity,
  matchesSearch,
  normalizeForSearch,
  sortAlphabetically,
} from "./list.ts";
import type { NameApiItem } from "./names.ts";

function item(overrides: Partial<NameApiItem>): NameApiItem {
  return {
    name: "TYMEK",
    display: "Tymek",
    gender: "M",
    popularity: "umiarkowane",
    registerCount: 100,
    inDeck: true,
    ...overrides,
  };
}

test("normalizeForSearch uppercases and strips Polish diacritics", () => {
  assert.equal(normalizeForSearch("małgorzata"), "MALGORZATA");
  assert.equal(normalizeForSearch("ŻANETA"), "ZANETA");
  assert.equal(normalizeForSearch("Łukasz"), "LUKASZ");
});

test("matchesSearch matches a substring anywhere in the name, diacritic- and case-insensitive", () => {
  const name = item({ name: "MAŁGORZATA", display: "Małgorzata" });
  assert.equal(matchesSearch(name, "malgo"), true);
  assert.equal(matchesSearch(name, "GORZATA"), true);
  assert.equal(matchesSearch(name, "łgorz"), true);
  assert.equal(matchesSearch(name, "xyz"), false);
});

test("matchesSearch treats an empty or whitespace query as matching everything", () => {
  const name = item({});
  assert.equal(matchesSearch(name, ""), true);
  assert.equal(matchesSearch(name, "   "), true);
});

test("matchesGender: 'all' matches both genders, a specific gender matches only itself", () => {
  const boy = item({ gender: "M" });
  const girl = item({ gender: "K" });
  assert.equal(matchesGender(boy, "all"), true);
  assert.equal(matchesGender(girl, "all"), true);
  assert.equal(matchesGender(boy, "M"), true);
  assert.equal(matchesGender(girl, "M"), false);
});

test("matchesPopularity: 'all' matches every band, a specific band matches only itself", () => {
  const rare = item({ popularity: "rzadko nadawane" });
  assert.equal(matchesPopularity(rare, "all"), true);
  assert.equal(matchesPopularity(rare, "rzadko nadawane"), true);
  assert.equal(matchesPopularity(rare, "bardzo popularne"), false);
});

test("filterNames combines search, gender and popularity filters (AND, not OR)", () => {
  const names = [
    item({ name: "MAŁGORZATA", display: "Małgorzata", gender: "K", popularity: "rzadko nadawane" }),
    item({ name: "MAGDALENA", display: "Magdalena", gender: "K", popularity: "bardzo popularne" }),
    item({ name: "MAREK", display: "Marek", gender: "M", popularity: "rzadko nadawane" }),
  ];

  const result = filterNames(names, {
    search: "ma",
    genderFilter: "K",
    popularityFilter: "rzadko nadawane",
  });

  assert.deepEqual(
    result.map((n) => n.name),
    ["MAŁGORZATA"],
  );
});

test("sortAlphabetically uses Polish collation, not codepoint order", () => {
  const names = [
    item({ name: "ZOFIA", display: "Zofia" }),
    item({ name: "ŁUKASZ", display: "Łukasz" }),
    item({ name: "ANNA", display: "Anna" }),
  ];

  const sorted = sortAlphabetically(names).map((n) => n.display);

  // Plain codepoint sort would put "Łukasz" after "Zofia" (Ł > Z in Unicode);
  // Polish collation orders Ł right after L, well before Z.
  assert.deepEqual(sorted, ["Anna", "Łukasz", "Zofia"]);
});
