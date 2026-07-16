# Persisted family-wide gender-scope setting

Supersedes ADR 0006 (`0006-deck-shows-both-genders-until-scope-setting-exists.md`): the Deck now
narrows to the family's chosen Gender, so CONTEXT.md's Deck definition is accurate again.

## Decision

- `genderScope` (`"M" | "K" | "all"`) is a new key in the existing `settings` table, alongside
  `surname` — no schema change needed, since `settings` was already a generic key/value store.
  `POST /api/settings` accepts `surname` and/or `genderScope` independently in one body, so the
  Family tab's two controls can commit separately.
- Defaults to `"all"` when unset, so existing families see no behavior change until someone
  deliberately narrows it in the Family tab.
- `deckPool()` (`deck.ts`) takes `genderScope` as a second argument and narrows by it in addition
  to `inDeck`. `deckOrder`'s `useMemo` in `use-name-picker.ts` depends on
  `familyState?.genderScope`, so the whole family's Swipe deck reshuffles and renarrows live via
  the existing state polling the moment anyone changes the setting — not just on next page load.
- Kept deliberately distinct, in naming and code, from `nameScope` in `use-name-picker.ts`, which
  remains local, unpersisted UI state for the Family tab's own name-list filter — a different
  concept that predates this setting and was never meant to become it.

## Why not a new endpoint

`setSurname()` was already the exact pattern to copy (`INSERT ... ON CONFLICT (key) DO UPDATE`),
and one endpoint validating two independent optional fields is simpler than two endpoints for
what the Family tab, from a user's perspective, treats as one settings screen.
