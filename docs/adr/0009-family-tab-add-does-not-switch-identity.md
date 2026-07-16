# Adding a participant from the Family tab does not switch device identity

`addParticipant()` (`use-name-picker.ts`, built for `Onboarding` in #5) both creates the
Participant and sets `currentUserId` to them — correct for onboarding, where the person adding
themselves *is* the new Participant.

The Family tab (#9) reuses the same `POST /api/participants` endpoint and colour-assignment rule
(per #9's acceptance criteria) but not this function directly: here the person adding a family
member is already identified as someone else, and is adding an entry on that family member's
behalf so the member can later claim it from their own device's onboarding screen. Reassigning
`currentUserId` as a side effect would silently swap the adder's own identity out from under
them.

`use-name-picker.ts` therefore exposes a second mutation, `addFamilyMember()`, sharing the POST
call and `participants` state update with `addParticipant()` but leaving `currentUserId`
untouched.
