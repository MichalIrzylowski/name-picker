import assert from "node:assert/strict";
import { test } from "node:test";
import { latestCountOf, chunk, buildNamesUpsertQuery, buildCohortsUpsertQuery } from "./seed.ts";

test("latestCountOf picks the count for the highest year present", () => {
  assert.equal(latestCountOf({ "2019": 10, "2020": 20, "2025": 30 }), 30);
});

test("latestCountOf handles gaps, picking the max year key regardless of order", () => {
  assert.equal(latestCountOf({ "2022": 2 }), 2);
  assert.equal(latestCountOf({ "2025": 4, "2019": 6 }), 4);
});

test("chunk splits an array into groups of the given size", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test("chunk returns an empty array for an empty input", () => {
  assert.deepEqual(chunk([], 3), []);
});

test("chunk returns a single group when size exceeds the input length", () => {
  assert.deepEqual(chunk([1, 2], 10), [[1, 2]]);
});

test("buildNamesUpsertQuery builds one VALUES tuple per row with flattened params", () => {
  const { text, params } = buildNamesUpsertQuery([
    { name: "NIKODEM", gender: "M", counts: { "2025": 5772 }, latestCount: 5772, registerCount: 77519 },
    { name: "ZOFIA", gender: "K", counts: { "2025": 4415 }, latestCount: 4415, registerCount: 360000 },
  ]);

  assert.match(text, /INSERT INTO names/);
  assert.match(text, /ON CONFLICT \(name\) DO UPDATE/);
  assert.match(text, /\$1,\$2,\$3,\$4,\$5/);
  assert.match(text, /\$6,\$7,\$8,\$9,\$10/);
  assert.deepEqual(params, [
    "NIKODEM",
    "M",
    JSON.stringify({ "2025": 5772 }),
    5772,
    77519,
    "ZOFIA",
    "K",
    JSON.stringify({ "2025": 4415 }),
    4415,
    360000,
  ]);
});

test("buildCohortsUpsertQuery builds one VALUES tuple per row with flattened params", () => {
  const { text, params } = buildCohortsUpsertQuery([
    { year: 2019, gender: "M", total: 199134 },
    { year: 2019, gender: "K", total: 188557 },
  ]);

  assert.match(text, /INSERT INTO cohorts/);
  assert.match(text, /ON CONFLICT \(year, gender\) DO UPDATE/);
  assert.match(text, /\$1,\$2,\$3/);
  assert.match(text, /\$4,\$5,\$6/);
  assert.deepEqual(params, [2019, "M", 199134, 2019, "K", 188557]);
});
