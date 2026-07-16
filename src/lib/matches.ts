import type { Participant, VoteValue } from "./db.ts";
import type { NameApiItem } from "./names.ts";

/** Selected Participant ids for the Shared tab's picker, defaulting to everyone. */
export function resolveSelection(
  participants: Participant[],
  selection: string[] | null,
): string[] {
  const valid = (selection ?? []).filter((id) => participants.some((p) => p.id === id));
  return valid.length > 0 ? valid : participants.map((p) => p.id);
}

/** Toggles one Participant's membership in the selection; never leaves it empty. */
export function toggleParticipant(
  selectedIds: string[],
  id: string,
  participants: Participant[],
): string[] {
  const next = selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id];
  return next.length > 0 ? next : participants.map((p) => p.id);
}

/** Names every selected Participant voted love on, drawn from the full pool (not just the Deck). */
export function computeMatches(
  names: NameApiItem[],
  votes: Record<string, Record<string, VoteValue>>,
  selectedIds: string[],
): NameApiItem[] {
  if (selectedIds.length === 0) return [];
  return names.filter((name) => selectedIds.every((id) => votes[name.name]?.[id] === "love"));
}
