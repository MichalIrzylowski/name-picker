# Two PESEL datasets, joined on (name, gender)

Poland publishes two open name datasets and they answer different questions, so we fetch
both. Dataset **219** ("Imiona nadawane dzieciom") gives Cohort counts — how many babies got
a name each year — and drives the Deck, Popularity and Trend. Dataset **1667** ("Lista imion
w rejestrze PESEL") gives Register counts — how many living people bear a name — and is used
for exactly one thing: the card's "W Polsce ≈ N osób" field, which the design labels
*wg rejestru PESEL*.

## Why not just one

The register alone is the intuitive choice ("all the names!") and it is wrong for this app:
it describes the whole living population, so its top names are PIOTR, KRZYSZTOF, TOMASZ,
ANDRZEJ — a ranking of 60-year-olds, useless for naming a baby. It also has a ~45,000-entry
tail of one-off and foreign spellings, and no year dimension, so Trend cannot exist.

Dataset 219 alone cannot answer "how many Zofias are there in Poland" — in the 2025 cohort
Zofia is 4,415; alive, she is ~360,000. The two numbers legitimately disagree and both are
shown. `JADWIGA` is the clearest case: ~205,000 living bearers, but only 268 babies in 2025 —
a common name that is rarely given. Collapsing these into one number destroys that.

## The join is on (name, gender) — never name alone

The register is published as separate male and female files, and both contain registration
noise: 14 women are registered as JAN, 18 as ALEKSANDER. Merging the two files keyed on name
alone lets that noise overwrite the real value, silently yielding `JAN = 14` instead of
462,503 — a wrong number that looks entirely plausible on a card. Every Name resolves its
Register count from the file matching its own dominant Gender.

## Consequences

All 3,544 names from 219 exist in the register under their dominant gender (verified: 100%
coverage), so the join needs no missing-data branch.
