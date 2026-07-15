# Trend is computed from share of cohort, not from raw counts

Trend compares a Name's **Share** (its Cohort count divided by the whole Cohort) in the
latest Cohort against the Cohort three years earlier: more than +15% is *rosnące*, less than
−15% is *spadające*, otherwise *stabilne*. It is deliberately **not** a comparison of raw
Cohort counts, even though that would be simpler code and is the obvious thing to write.

## Why

Polish births collapsed over the period the data covers — 387,691 first names in the 2019
cohorts against 246,192 in 2025, a **36.5% fall**. Raw counts therefore fall for almost every
name regardless of whether it is gaining or losing favour, so a count-based trend labels
nearly everything *spadające* and actively misinforms:

| Name   | 2019  | 2025  | by raw count | by share |
|--------|-------|-------|--------------|----------|
| LAURA  | 3,938 | 3,821 | **−3.0%**    | **+52.7%** |
| OLIWIA | 4,858 | 3,067 | −36.9%       | −0.6%    |
| EMILIA | 3,871 | 2,556 | −34.0%       | +3.9%    |
| JULIA  | 8,189 | 3,207 | −60.8%       | −38.4%   |

LAURA is one of the fastest-rising girls' names in Poland; raw counts call it falling. Across
all girls' names raw counts claim 47% are declining, where share says 27%.

## Consequences

The birth collapse is invisible from inside the code — the maths looks like needless
complexity, and "simplifying" it to a count comparison will produce plausible-looking output
that is wrong for essentially every name. That is why this ADR exists.

Trend is undefined (rendered as nothing, not as *stabilne*) when the latest Cohort count is
below 25, because share ratios on a handful of babies are noise — a name going from one baby
to two is not a 100% rise. A Name absent three years ago but real today counts as *rosnące*
rather than undefined: that is a genuine signal, not a divide-by-zero to suppress.
