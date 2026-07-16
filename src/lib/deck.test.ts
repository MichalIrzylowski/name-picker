import assert from "node:assert/strict";
import { test } from "node:test";
import { deckPool, shuffled, unvoted } from "./deck.ts";
import type { NameApiItem } from "./names.ts";

function item(name: string, inDeck: boolean): NameApiItem {
  return {
    name,
    display: name,
    gender: "M",
    popularity: inDeck ? "umiarkowane" : "rzadko nadawane",
    registerCount: 0,
    inDeck,
  };
}

test("deckPool keeps only names with inDeck true", () => {
  const names = [item("JAN", true), item("TYMEK", false), item("ADA", true)];
  assert.deepEqual(
    deckPool(names).map((n) => n.name),
    ["JAN", "ADA"],
  );
});

test("shuffled returns every input item exactly once, in an order the injected random fn determines", () => {
  const items = [1, 2, 3, 4, 5];
  // A random fn that always returns 0 swaps every element with index 0 (reverses via repeated swap-with-first).
  const result = shuffled(items, () => 0);
  assert.deepEqual([...result].sort(), [...items].sort());
  assert.equal(result.length, items.length);
});

test("shuffled does not mutate its input", () => {
  const items = [1, 2, 3];
  const copy = [...items];
  shuffled(items, () => 0.5);
  assert.deepEqual(items, copy);
});

test("shuffled with a constant-max random fn still includes every item once (no out-of-bounds swap)", () => {
  const items = ["a", "b", "c", "d"];
  const result = shuffled(items, () => 0.999999);
  assert.deepEqual([...result].sort(), [...items].sort());
});

test("unvoted excludes names the participant already voted on", () => {
  const order = [item("JAN", true), item("ADA", true), item("TYMEK", true)];
  const votes = { JAN: { p1: "love" as const }, TYMEK: { p2: "no" as const } };
  assert.deepEqual(
    unvoted(order, votes, "p1").map((n) => n.name),
    ["ADA", "TYMEK"],
  );
});

test("unvoted keeps a name the participant hasn't voted on even if others have", () => {
  const order = [item("JAN", true)];
  const votes = { JAN: { someoneElse: "love" as const } };
  assert.deepEqual(
    unvoted(order, votes, "p1").map((n) => n.name),
    ["JAN"],
  );
});

test("unvoted returns everything unchanged when there are no votes yet", () => {
  const order = [item("JAN", true), item("ADA", true)];
  assert.deepEqual(
    unvoted(order, {}, "p1").map((n) => n.name),
    ["JAN", "ADA"],
  );
});
