"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { filterNames, sortAlphabetically } from "@/lib/list";
import { displayName, EMOJI, TREND } from "@/lib/names";
import type { NameApiItem } from "@/lib/names";
import type { GenderFilter, PopularityFilter, UseNamePicker } from "./use-name-picker";
import type { VoteValue } from "@/lib/db";

const ROW_HEIGHT_PX = 84;

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "K", label: "Dziewczynki" },
  { value: "M", label: "Chłopcy" },
];

const POPULARITY_OPTIONS: { value: PopularityFilter; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "bardzo popularne", label: "Bardzo popularne" },
  { value: "popularne", label: "Popularne" },
  { value: "umiarkowane", label: "Umiarkowane" },
  { value: "rzadko nadawane", label: "Rzadko nadawane" },
];

const VOTE_ORDER: VoteValue[] = ["no", "maybe", "love"];

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{
        background: active ? "#F2A31B" : "rgba(247,239,221,.08)",
        color: active ? "#2A2118" : "rgba(247,239,221,.75)",
        border: active ? "1px solid #F2A31B" : "1px solid rgba(247,239,221,.22)",
      }}
    >
      {label}
    </button>
  );
}

function VoteButton({
  value,
  active,
  onClick,
}: {
  value: VoteValue;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px]"
      style={{
        border: active ? "2px solid #F2A31B" : "1px solid rgba(247,239,221,.25)",
        background: active ? "rgba(242,163,27,.18)" : "transparent",
      }}
    >
      {EMOJI[value]}
    </button>
  );
}

function ListRow({
  name,
  vote,
  onVote,
}: {
  name: NameApiItem;
  vote: VoteValue | undefined;
  onVote: (value: VoteValue) => void;
}) {
  const isGirl = name.gender === "K";

  return (
    <div
      className="flex items-center gap-3 px-4"
      style={{ height: ROW_HEIGHT_PX, borderBottom: "1px solid rgba(247,239,221,.1)" }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: isGirl ? "#C24328" : "#2F6B52" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="truncate text-[17px] font-semibold"
            style={{ fontFamily: "var(--font-fraunces), serif", color: "#F7EFDD" }}
          >
            {displayName(name.name)}
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase"
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              letterSpacing: ".05em",
              color: "rgba(247,239,221,.75)",
              background: "rgba(247,239,221,.08)",
              border: "1px solid rgba(247,239,221,.2)",
            }}
          >
            {name.popularity}
          </span>
        </div>
        <div className="mt-0.5 text-[12px]" style={{ color: name.trend ? TREND[name.trend].color : "rgba(247,239,221,.35)" }}>
          {name.trend ? `${TREND[name.trend].glyph} ${TREND[name.trend].label}` : "—"}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {VOTE_ORDER.map((value) => (
          <VoteButton key={value} value={value} active={vote === value} onClick={() => onVote(value)} />
        ))}
      </div>
    </div>
  );
}

interface ListTabProps {
  picker: UseNamePicker;
}

export function ListTab({ picker }: ListTabProps) {
  const { names, familyState, currentUser, search, setSearch, genderFilter, setGenderFilter, popularityFilter, setPopularityFilter } =
    picker;

  const parentRef = useRef<HTMLDivElement>(null);

  const visibleNames = useMemo(() => {
    const filtered = filterNames(names, { search, genderFilter, popularityFilter });
    return sortAlphabetically(filtered);
  }, [names, search, genderFilter, popularityFilter]);

  const virtualizer = useVirtualizer({
    count: visibleNames.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
  });

  if (!currentUser || !familyState) return null;

  const votes = familyState.votes;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-2.5 px-4 pb-3 pt-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj imienia…"
          className="rounded-full px-4 py-2.5 text-[14px]"
          style={{ border: "1px solid rgba(247,239,221,.25)", background: "rgba(247,239,221,.06)", color: "#F7EFDD" }}
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {GENDER_OPTIONS.map((opt) => (
            <Chip key={opt.value} active={genderFilter === opt.value} label={opt.label} onClick={() => setGenderFilter(opt.value)} />
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {POPULARITY_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={popularityFilter === opt.value}
              label={opt.label}
              onClick={() => setPopularityFilter(opt.value)}
            />
          ))}
        </div>
      </div>

      {visibleNames.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm opacity-60">
          Brak imion pasujących do wyszukiwania.
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-y-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const name = visibleNames[virtualRow.index];
              return (
                <div
                  key={name.name}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ListRow
                    name={name}
                    vote={votes[name.name]?.[currentUser.id]}
                    onVote={(value) => picker.castVote(name.name, value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
