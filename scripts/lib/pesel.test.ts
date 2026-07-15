import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchCohortTitle,
  matchRegisterTitle,
  resolveCsvUrl,
  parseNameRows,
  dominantGenders,
  cohortTotals,
  buildNameCounts,
  joinRegisterCounts,
} from "./pesel.ts";

test("matchCohortTitle matches a first-name cohort title", () => {
  assert.deepEqual(
    matchCohortTitle("Imiona żeńskie nadane dzieciom w Polsce w 2024 r. - imię pierwsze"),
    { gender: "K", year: 2024 },
  );
  assert.deepEqual(
    matchCohortTitle("Imiona męskie nadane dzieciom w Polsce w 2019 r. - imię pierwsze"),
    { gender: "M", year: 2019 },
  );
});

test("matchCohortTitle excludes second-name, voivodeship and USC breakdowns", () => {
  assert.equal(
    matchCohortTitle("Imiona męskie nadane dzieciom w Polsce w 2019 r. - imię drugie"),
    null,
  );
  assert.equal(
    matchCohortTitle(
      "Imiona żeńskie nadane dzieciom w Polsce w 2024 r. - imię pierwsze wg województw",
    ),
    null,
  );
  assert.equal(
    matchCohortTitle("Imiona żeńskie nadane dzieciom w Polsce w 2024 r. - imię pierwsze wg USC"),
    null,
  );
});

test("matchRegisterTitle matches a first-name register title", () => {
  assert.deepEqual(
    matchRegisterTitle("lista imion męskich w rejestrze PESEL stan na 20.01.2026 - imię pierwsze"),
    { gender: "M", date: "2026-01-20" },
  );
});

test("matchRegisterTitle excludes second-name breakdowns", () => {
  assert.equal(
    matchRegisterTitle("lista imion męskich w rejestrze PESEL stan na 20.01.2026 - imię drugie"),
    null,
  );
});

test("resolveCsvUrl prefers csv_download_url when present", () => {
  assert.equal(
    resolveCsvUrl({ csvDownloadUrl: "https://example.com/a.csv", link: "https://example.com/a.xlsx" }),
    "https://example.com/a.csv",
  );
});

test("resolveCsvUrl falls back to link when csv_download_url is null (native CSV resources)", () => {
  assert.equal(
    resolveCsvUrl({ csvDownloadUrl: null, link: "https://example.com/native.csv" }),
    "https://example.com/native.csv",
  );
});

test("parseNameRows parses positionally, ignoring header text", () => {
  const csv = "IMIĘ_PIERWSZE,PŁEĆ,LICZBA_WYSTĄPIEŃ\nJAN,MĘŻCZYZNA,8032\nANNA,KOBIETA,7000\n";
  assert.deepEqual(parseNameRows(csv), [
    { name: "JAN", gender: "M", count: 8032 },
    { name: "ANNA", gender: "K", count: 7000 },
  ]);
});

test("parseNameRows tolerates 2022's differently-spelled header (space instead of underscore)", () => {
  const csv = "IMIĘ PIERWSZE,PŁEĆ,LICZBA WYSTĄPIENIEŃ\nANTONI,MĘŻCZYZNA,6670\n";
  assert.deepEqual(parseNameRows(csv), [{ name: "ANTONI", gender: "M", count: 6670 }]);
});

test("dominantGenders picks the gender with the higher total count across all cohorts", () => {
  const rowsByYear = [
    {
      year: 2019,
      rows: [
        { name: "ALEKSANDER", gender: "M" as const, count: 7432 },
        { name: "ALEKSANDER", gender: "K" as const, count: 2 },
      ],
    },
    {
      year: 2020,
      rows: [{ name: "ALEKSANDER", gender: "M" as const, count: 6000 }],
    },
  ];
  assert.equal(dominantGenders(rowsByYear).get("ALEKSANDER"), "M");
});

test("cohortTotals sums every row's count per year+gender, independent of dominant gender", () => {
  const rowsByYear = [
    {
      year: 2019,
      rows: [
        { name: "JAN", gender: "M" as const, count: 8032 },
        { name: "ANTONI", gender: "M" as const, count: 8550 },
      ],
    },
  ];
  assert.deepEqual(cohortTotals(rowsByYear), [{ year: 2019, gender: "M", total: 16582 }]);
});

test("buildNameCounts drops minority-gender rows from a name's counts series", () => {
  const rowsByYear = [
    {
      year: 2019,
      rows: [
        { name: "ALEKSANDER", gender: "M" as const, count: 7432 },
        { name: "ALEKSANDER", gender: "K" as const, count: 2 },
      ],
    },
    {
      year: 2020,
      rows: [{ name: "ALEKSANDER", gender: "M" as const, count: 6000 }],
    },
  ];
  const dominant = dominantGenders(rowsByYear);
  const names = buildNameCounts(rowsByYear, dominant);
  assert.deepEqual(names.get("ALEKSANDER"), {
    gender: "M",
    counts: { 2019: 7432, 2020: 6000 },
  });
});

test("joinRegisterCounts keys the join on (name, dominant gender), not name alone", () => {
  const names = new Map([
    ["JAN", { gender: "M" as const, counts: { 2019: 8032 } }],
  ]);
  const registerRows = [
    { name: "JAN", gender: "K" as const, count: 14 },
    { name: "JAN", gender: "M" as const, count: 462503 },
  ];
  const joined = joinRegisterCounts(names, registerRows);
  assert.equal(joined.get("JAN")?.registerCount, 462503);
});
