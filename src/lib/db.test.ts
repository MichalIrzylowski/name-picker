import assert from "node:assert/strict";
import { test } from "node:test";
import { isGenderScope } from "./db.ts";

test("isGenderScope accepts 'all', 'M' and 'K'", () => {
  assert.equal(isGenderScope("all"), true);
  assert.equal(isGenderScope("M"), true);
  assert.equal(isGenderScope("K"), true);
});

test("isGenderScope rejects anything else", () => {
  assert.equal(isGenderScope("F"), false);
  assert.equal(isGenderScope(""), false);
  assert.equal(isGenderScope(undefined), false);
  assert.equal(isGenderScope(null), false);
  assert.equal(isGenderScope(1), false);
});
