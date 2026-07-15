# Wybieramy imię

A private family app for choosing a baby's first name: everyone swipes through candidate
Polish names, votes, and the app surfaces the ones the family agrees on. Names and their
popularity come from Poland's open PESEL data; votes and family members are the family's own.

## Language

### Name data

**Name**:
A Polish first name that has been given to at least one baby since 2019, as recorded in the
PESEL data. Uppercase is its identity (`NIKODEM`); mixed case is only ever presentation.
_Avoid_: given name, forename, imię

**Gender**:
Whether a Name is a boy's or a girl's name. Every Name has exactly one, decided by which
gender it was given to more often across all Cohorts. The source's rare contradictions
(two girls registered as `ALEKSANDER`) are registration noise, not evidence of ambiguity.
_Avoid_: sex, płeć

**Cohort**:
All babies of one gender given first names in one calendar year. The unit Poland publishes
baby-name data in, and what one fetched file contains.
_Avoid_: year file, dataset, resource

**Cohort count**:
How many babies in one Cohort were given a Name — how fashionable it is *now*. Drives
Popularity, Trend, and the Deck.
_Avoid_: count (too vague — always say which), popularity, liczba

**Register count**:
How many *living people* in Poland bear a Name, across every generation. A different
question from Cohort count and frequently a contradictory answer: `JADWIGA` has ~205,000
living bearers but is given to only a few hundred babies a year. Shown on the card as
"W Polsce", and used for nothing else.
_Avoid_: count, total, population

**Share**:
A Name's Cohort count as a fraction of its whole Cohort. The only honest way to compare
across years, because Polish births fell 36% between 2019 and 2025 — raw Cohort counts
fall for nearly every Name regardless of fashion.
_Avoid_: percentage, rate, proportion

**Trend**:
Whether a Name is coming into or going out of fashion, from the change in its Share
between the latest Cohort and the one three years earlier. Undefined for a Name almost
nobody is given now.
_Avoid_: momentum, direction, popularity change

**Popularity**:
Which of four bands a Name's latest Cohort count falls in — *bardzo popularne*,
*popularne*, *umiarkowane*, *rzadko nadawane*. The lowest band is exactly the Names
outside the Deck.
_Avoid_: category, cat, bucket, rank

**Deck**:
The Names dealt to a Participant to swipe: those common enough now to be worth an opinion,
narrowed to the family's chosen Gender. Every other Name is still reachable by searching —
the Deck limits what is *offered*, never what can be voted on.
_Avoid_: pool, candidates, list, queue

### The family's own data

**Participant**:
A family member who votes. Anyone can add one, anyone can remove one, and there is no
login. Each device remembers which Participant it belongs to.
_Avoid_: user, profile, member, account

**Vote**:
One Participant's reaction to one Name — ❤️, 🤔 or ❌. Never anonymous; the family sees
who voted what.
_Avoid_: rating, swipe, choice

**Note**:
A short remark a Participant attaches to a Name, visible to the whole family
("tak miała na imię prababcia").
_Avoid_: comment, annotation

**Match**:
A Name that every selected Participant voted ❤️ on. The point of the app.
_Avoid_: shared pick, agreement, consensus
