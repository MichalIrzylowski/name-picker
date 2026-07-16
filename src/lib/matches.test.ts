import assert from "node:assert/strict";
import { test } from "node:test";
import { computeMatches, resolveSelection, toggleParticipant } from "./matches.ts";
import type { NameApiItem } from "./names.ts";
import type { Participant } from "./db.ts";

function item(name: string): NameApiItem {
  return {
    name,
    display: name,
    gender: "M",
    popularity: "umiarkowane",
    registerCount: 0,
    inDeck: false,
  };
}

function participant(id: string): Participant {
  return { id, name: id, color: "#000000" };
}

const ANIA = participant("ania");
const TOMEK = participant("tomek");
const BABCIA = participant("babcia");
const PARTICIPANTS = [ANIA, TOMEK, BABCIA];

test("resolveSelection defaults to every participant when selection is null", () => {
  assert.deepEqual(resolveSelection(PARTICIPANTS, null), ["ania", "tomek", "babcia"]);
});

test("resolveSelection defaults to every participant when selection is empty", () => {
  assert.deepEqual(resolveSelection(PARTICIPANTS, []), ["ania", "tomek", "babcia"]);
});

test("resolveSelection drops ids for participants who no longer exist", () => {
  assert.deepEqual(resolveSelection(PARTICIPANTS, ["ania", "removed-id"]), ["ania"]);
});

test("resolveSelection defaults to every participant when every selected id was removed", () => {
  assert.deepEqual(resolveSelection(PARTICIPANTS, ["removed-id"]), ["ania", "tomek", "babcia"]);
});

test("toggleParticipant removes an id that was selected", () => {
  assert.deepEqual(toggleParticipant(["ania", "tomek"], "ania", PARTICIPANTS), ["tomek"]);
});

test("toggleParticipant adds an id that wasn't selected", () => {
  assert.deepEqual(toggleParticipant(["ania"], "tomek", PARTICIPANTS), ["ania", "tomek"]);
});

test("toggleParticipant falls back to every participant when the last one is deselected", () => {
  assert.deepEqual(toggleParticipant(["ania"], "ania", PARTICIPANTS), ["ania", "tomek", "babcia"]);
});

test("computeMatches returns names every selected participant voted love on", () => {
  const names = [item("HANNA"), item("ZOFIA"), item("JAN")];
  const votes = {
    HANNA: { ania: "love" as const, tomek: "love" as const },
    ZOFIA: { ania: "love" as const, tomek: "maybe" as const },
    JAN: { ania: "love" as const },
  };
  assert.deepEqual(
    computeMatches(names, votes, ["ania", "tomek"]).map((n) => n.name),
    ["HANNA"],
  );
});

test("computeMatches returns nothing when no participants are selected", () => {
  const names = [item("HANNA")];
  const votes = { HANNA: { ania: "love" as const } };
  assert.deepEqual(computeMatches(names, votes, []), []);
});

test("computeMatches draws from the full pool, not just names in the votes map", () => {
  const names = [item("HANNA"), item("RZADKIE")];
  const votes = { RZADKIE: { ania: "love" as const } };
  assert.deepEqual(
    computeMatches(names, votes, ["ania"]).map((n) => n.name),
    ["RZADKIE"],
  );
});

test("computeMatches excludes a name a selected participant never voted on", () => {
  const names = [item("HANNA")];
  const votes = {};
  assert.deepEqual(computeMatches(names, votes, ["ania"]), []);
});
