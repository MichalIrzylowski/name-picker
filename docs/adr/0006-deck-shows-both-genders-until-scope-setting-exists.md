# Deck shows both genders until a gender-scope setting exists

CONTEXT.md's Deck definition says the Deck is "narrowed to the family's chosen Gender," but no
family-wide gender-scope setting was ever built — `settings` only holds `surname` (#4), and
`nameScope` in `use-name-picker.ts` is local, unpersisted UI state for the Family tab's own
name-list filter, not a shared family choice. #6 (the Swipe tab) therefore shows Deck names of
both genders rather than silently under-delivering on a setting that doesn't exist.

This is a deliberate, temporary gap, not a bug: once a real persisted gender-scope setting
lands (tracked against #4/#9), the Swipe deck should start narrowing by it, and the Deck
glossary entry will then be accurate again.
