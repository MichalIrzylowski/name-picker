import type { GenderScope, VoteValue } from "./db.ts";
import type { NameApiItem } from "./names.ts";

/** Names offered for swiping — the Deck floor, narrowed to the family's chosen gender scope. */
export function deckPool(names: NameApiItem[], genderScope: GenderScope): NameApiItem[] {
  return names.filter((n) => n.inDeck && (genderScope === "all" || n.gender === genderScope));
}

/** Fisher-Yates, with an injectable random source so callers can seed it for tests. */
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Deck order narrowed to names this Participant hasn't voted on yet. */
export function unvoted(
  order: NameApiItem[],
  votes: Record<string, Record<string, VoteValue>>,
  participantId: string,
): NameApiItem[] {
  return order.filter((n) => !votes[n.name]?.[participantId]);
}
