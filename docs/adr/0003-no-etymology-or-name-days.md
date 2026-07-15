# The card drops Pochodzenie and Imieniny

The source design's name card shows five facts: gender, Pochodzenie (etymology, e.g.
*greckie — sophía, „mądrość"*), Imieniny (name day, e.g. *15 maja*), W Polsce (Register
count) and Trend. We ship it without Pochodzenie and Imieniny. This is deliberate, not an
oversight — those two fields have **no source**, and every other number on the card traces
back to PESEL.

## Why not source them

- **dane.gov.pl has no name-day dataset.** Searching it for *imieniny* returns only false
  positives matching *"w imieniu"* ("on behalf of").
- **Wikidata is worse than nothing.** Its name-day property (P1750) covers **24%** of our
  353-name Deck, missing ALEKSANDER, AGNIESZKA, ALICJA and AMELIA — among the most common
  names in Poland. What it does return is largely the **French** calendar
  (`MARTINE → 30 stycznia`), so the dates would frequently be wrong *for Poland* while
  looking authoritative.
- **Etymology has no dataset at all**, in any form, for 3,544 Polish names.

## The rejected alternative

Authoring the lore ourselves — by hand or with an LLM — for the ~353 Deck names. Rejected
because it is invention wearing the costume of data: nobody will audit 353 etymologies, and
a wrong *imieniny* date is exactly the error a Polish grandmother spots instantly, which
would undermine trust in the numbers that *are* real. This app is worth more with four
sourced facts than six facts of which two are plausible fiction.

## Consequences

The card's field grid recomposes around gender, name, Register count and Trend. The list
row's `meta` line drops its *imieniny* segment.

If a licensed Polish name-day calendar ever turns up, Imieniny can come back cheaply — it is
a per-Name lookup with no bearing on the schema. Etymology should stay out unless a real
source appears.
