# Referential errors are not pre-validated in the family-state API

The mutation routes (`/api/votes`, `/api/notes`, `/api/participants/:id` DELETE cascade, etc.)
check that required fields are present, non-empty, and that enum fields (`votes.value`) hold a
legal value, returning `400` for those. They deliberately do **not** run an existence check
before referencing a `nameId`/`participantId`/`authorId` — a vote for a name that doesn't
exist, or a note from a participant that's been removed, is left to fail on the database's own
foreign-key constraint and surface as an unhandled `500`.

This looks like a missing validation step, not a choice, so it's worth recording: the
alternative (a `SELECT ... WHERE id = $1` existence check before every write that references
another table) would double the query count on every mutation route in an app with no
adversarial users — the family member typing a curl command by hand is the only plausible
source of a bad ID, and the DB already rejects it correctly. If a future ticket needs a
friendlier error for that case, add the pre-check then, for that route specifically.
