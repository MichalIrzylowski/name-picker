# Shared tab's match list is not virtualized

ADR 0007 virtualizes the List tab because it renders all 3,544 names. The Shared tab
(`SharedTab.tsx`, #8) also draws from the full 3,544-name pool, so it might look like the same
case — but its rendered set is the *Matches* (names every selected Participant voted ❤️ on), not
the pool itself. That's bounded by how much a small family agrees on, realistically dozens of
names at most, never thousands. A plain `.map()` render is simpler and the design's full
per-match card (vote breakdown, notes, note composer) is heavier than a virtualizer would be
worth here. Revisit only if match lists start approaching List-tab scale in practice.
