import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DECK_FLOOR,
  POPULARITY_MODERATE,
  POPULARITY_POPULAR,
  POPULARITY_VERY_POPULAR,
  cohortMapOf,
  displayName,
  popularityOf,
  toApiItem,
  trendOf,
} from "./names.ts";

test("displayName title-cases an uppercase-identity name", () => {
  assert.equal(displayName("NIKODEM"), "Nikodem");
});

test("displayName handles Polish diacritics correctly", () => {
  assert.equal(displayName("ŁUKASZ"), "Łukasz");
  assert.equal(displayName("ŻANETA"), "Żaneta");
  assert.equal(displayName("ŚWIATOSŁAW"), "Światosław");
  assert.equal(displayName("ĆWIK"), "Ćwik");
  assert.equal(displayName("ÓSMY"), "Ósmy");
});

test("popularityOf bands match the Deck floor and named thresholds", () => {
  assert.equal(POPULARITY_MODERATE, DECK_FLOOR);
  assert.equal(popularityOf(POPULARITY_VERY_POPULAR), "bardzo popularne");
  assert.equal(popularityOf(POPULARITY_VERY_POPULAR - 1), "popularne");
  assert.equal(popularityOf(POPULARITY_POPULAR), "popularne");
  assert.equal(popularityOf(POPULARITY_POPULAR - 1), "umiarkowane");
  assert.equal(popularityOf(POPULARITY_MODERATE), "umiarkowane");
  assert.equal(popularityOf(POPULARITY_MODERATE - 1), "rzadko nadawane");
  assert.equal(popularityOf(0), "rzadko nadawane");
});

test("trendOf is undefined when the latest Cohort count is below the noise floor", () => {
  const cohorts = { "2022-M": 100000, "2025-M": 90000 };
  assert.equal(trendOf({ "2022": 20, "2025": 24 }, cohorts, "M"), undefined);
});

test("trendOf treats a name absent 3 years ago but real now as up, without needing older cohort totals", () => {
  const cohorts = { "2025-M": 90000 };
  assert.equal(trendOf({ "2025": 30 }, cohorts, "M"), "up");
});

test("trendOf is up when Share rises more than 15%, even though the raw count falls (ADA-shaped regression)", () => {
  // real 2022/2025 K cohort totals and ADA's real counts: raw count falls
  // 223 -> 205 (-8%), but share rises ~19.6% because the K cohort shrank faster.
  const cohorts = { "2022-K": 155704, "2025-K": 119788 };
  assert.equal(trendOf({ "2022": 223, "2025": 205 }, cohorts, "K"), "up");
});

test("trendOf is down when Share falls more than 15%", () => {
  const cohorts = { "2022-K": 300000, "2025-K": 246192 };
  assert.equal(trendOf({ "2022": 8189, "2025": 3207 }, cohorts, "K"), "down");
});

test("trendOf is stable when Share change is within +-15%", () => {
  const cohorts = { "2022-M": 100000, "2025-M": 90000 };
  // share: 2022 = 1000/100000 = 1%, 2025 = 900/90000 = 1% -> unchanged
  assert.equal(trendOf({ "2022": 1000, "2025": 900 }, cohorts, "M"), "stable");
});

test("trendOf is stable exactly at the +15% boundary (strictly greater than required)", () => {
  const cohorts = { "2022-M": 100000, "2025-M": 100000 };
  // share 2022 = 1000/100000 = 1%, share 2025 = 1150/100000 = 1.15% -> +15% exactly
  assert.equal(trendOf({ "2022": 1000, "2025": 1150 }, cohorts, "M"), "stable");
});

test("trendOf is up just past the +15% boundary", () => {
  const cohorts = { "2022-M": 100000, "2025-M": 100000 };
  assert.equal(trendOf({ "2022": 1000, "2025": 1151 }, cohorts, "M"), "up");
});

test("cohortMapOf keys totals by year-gender", () => {
  const map = cohortMapOf([
    { year: 2019, gender: "M", total: 199134 },
    { year: 2025, gender: "K", total: 119788 },
  ]);
  assert.deepEqual(map, { "2019-M": 199134, "2025-K": 119788 });
});

test("toApiItem omits the trend key entirely when trendOf returns undefined", () => {
  const row = {
    name: "TYMEK",
    gender: "M" as const,
    counts: { "2025": 10 },
    latestCount: 10,
    registerCount: 500,
  };
  const item = toApiItem(row, {});
  assert.equal("trend" in item, false);
  assert.deepEqual(item, {
    name: "TYMEK",
    display: "Tymek",
    gender: "M",
    popularity: "rzadko nadawane",
    registerCount: 500,
    inDeck: false,
  });
});

test("toApiItem includes trend, display name and popularity/inDeck agreement when latestCount is at the floor", () => {
  const row = {
    name: "BORYS",
    gender: "M" as const,
    counts: { "2025": 50 },
    latestCount: 50,
    registerCount: 24000,
  };
  const item = toApiItem(row, {});
  assert.equal(item.trend, "up");
  assert.equal(item.popularity, "umiarkowane");
  assert.equal(item.inDeck, true);
});

test("toApiItem never disagrees between the bottom Popularity band and inDeck", () => {
  const row = {
    name: "GUSTAW",
    gender: "M" as const,
    counts: { "2025": 49 },
    latestCount: 49,
    registerCount: 29000,
  };
  const item = toApiItem(row, {});
  assert.equal(item.popularity, "rzadko nadawane");
  assert.equal(item.inDeck, false);
});
