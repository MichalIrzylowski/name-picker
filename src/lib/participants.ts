/**
 * Assigned by join order: the first three joiners get the design's three
 * signature colours; later joiners cycle through the extras. See ADR-adjacent
 * note in docs/plan-name-picker.md's "Deviations from the design" section.
 */
export const PARTICIPANT_PALETTE = [
  "#F2A31B",
  "#D9482B",
  "#4C7FB8",
  "#7BA05B",
  "#C77FB0",
  "#5FA8A0",
  "#B4552F",
  "#8E6FC0",
];

export function colorForJoinOrder(existingCount: number): string {
  return PARTICIPANT_PALETTE[existingCount % PARTICIPANT_PALETTE.length];
}
