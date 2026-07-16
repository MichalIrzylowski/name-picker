"use client";

import { useState } from "react";
import { computeMatches, resolveSelection, toggleParticipant } from "@/lib/matches";
import { sortAlphabetically } from "@/lib/list";
import { displayName, EMOJI, VOTE_LABEL } from "@/lib/names";
import type { NameApiItem } from "@/lib/names";
import type { FamilyState, Participant, VoteValue } from "@/lib/db";
import type { UseNamePicker } from "./use-name-picker";

function ParticipantChip({
  participant,
  active,
  onClick,
}: {
  participant: Participant;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{
        background: active ? "rgba(242,163,27,.18)" : "transparent",
        color: active ? "#F2A31B" : "rgba(247,239,221,.75)",
        border: active ? "1px solid #F2A31B" : "1px solid rgba(247,239,221,.3)",
      }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: participant.color }} />
      {participant.name}
    </button>
  );
}

function MatchCard({
  name,
  selectedParticipants,
  votes,
  notes,
  surname,
  draft,
  onDraftChange,
  onAddNote,
}: {
  name: NameApiItem;
  selectedParticipants: Participant[];
  votes: Record<string, VoteValue>;
  notes: { authorId: string; text: string }[];
  surname: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onAddNote: () => void;
}) {
  const findParticipant = (authorId: string) =>
    selectedParticipants.find((p) => p.id === authorId);

  return (
    <div style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,.3))" }}>
      <div
        className="h-[9px]"
        style={{
          backgroundImage: "radial-gradient(circle 9px at 9px 9px, #F7EFDD 98%, rgba(0,0,0,0))",
          backgroundSize: "18px 9px",
          backgroundRepeat: "repeat-x",
        }}
      />
      <div className="px-[18px] pb-4 pt-3.5" style={{ background: "#F7EFDD", color: "#2A2118" }}>
        <div
          className="text-[27px] font-semibold"
          style={{ fontFamily: "var(--font-fraunces), serif", color: "#0F3B2E" }}
        >
          {surname ? `${displayName(name.name)} ${surname}` : displayName(name.name)}
        </div>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {selectedParticipants.map((p) => {
            const vote = votes[p.id];
            return (
              <div key={p.id} className="flex items-center gap-2 text-[13px]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                <span className="flex-1 font-semibold">{p.name}</span>
                <span>{vote ? EMOJI[vote] : "—"}</span>
                <span className="text-[12px]" style={{ color: "#8A7A5F" }}>
                  {vote ? VOTE_LABEL[vote] : "brak głosu"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2.5" style={{ borderTop: "1px dashed #D9C9A8" }}>
          {notes.map((note, i) => (
            <div key={i} className="mb-1.5 flex items-baseline gap-1.5 text-[12.5px]" style={{ color: "#5A4C3A" }}>
              <span className="whitespace-nowrap font-semibold" style={{ color: findParticipant(note.authorId)?.color ?? "#8A7A5F" }}>
                {findParticipant(note.authorId)?.name ?? note.authorId}:
              </span>
              <span className="italic">{note.text}</span>
            </div>
          ))}
          <div className="mt-1 flex gap-2">
            <input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Wspólna notatka…"
              className="min-w-0 flex-1 rounded-lg px-2.5 py-[7px] text-[12.5px]"
              style={{ border: "1px solid #D9C9A8", background: "#FFFDF6", color: "#2A2118" }}
            />
            <button
              type="button"
              onClick={onAddNote}
              className="cursor-pointer rounded-lg px-3 py-[7px] text-[12px] font-semibold"
              style={{ border: 0, background: "#0F3B2E", color: "#F7EFDD" }}
            >
              Dodaj
            </button>
          </div>
        </div>
      </div>
      <div
        className="h-[9px]"
        style={{
          backgroundImage: "radial-gradient(circle 9px at 9px 0px, #F7EFDD 98%, rgba(0,0,0,0))",
          backgroundSize: "18px 9px",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  );
}

interface SharedTabProps {
  picker: UseNamePicker;
}

export function SharedTab({ picker }: SharedTabProps) {
  const { names, familyState, matchSelection, setMatchSelection } = picker;
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!familyState) return null;

  const state: FamilyState = familyState;
  const selectedIds = resolveSelection(state.participants, matchSelection);
  const selectedParticipants = state.participants.filter((p) => selectedIds.includes(p.id));
  const matches = sortAlphabetically(computeMatches(names, state.votes, selectedIds));
  const surname = state.surname.trim();

  const rule =
    selectedParticipants.length < state.participants.length
      ? `Dopasowania między: ${selectedParticipants.map((p) => p.name).join(", ")}. Imiona ocenione przez wybrane osoby na ❤️ — z pełnym rozkładem głosów.`
      : "Imiona ocenione przez wybrane osoby na ❤️ — z pełnym rozkładem głosów.";

  return (
    <div className="flex flex-col gap-4 px-[18px] pb-7 pt-4.5">
      <div>
        <div className="text-[27px] font-semibold" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Wasze wspólne typy
        </div>
        <div className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "rgba(247,239,221,.7)" }}>
          {rule}
        </div>
      </div>

      <div>
        <div
          className="mb-2 text-[10.5px] uppercase"
          style={{ letterSpacing: ".14em", color: "rgba(242,163,27,.9)" }}
        >
          Dopasuj między
        </div>
        <div className="flex flex-wrap gap-2">
          {state.participants.map((p) => (
            <ParticipantChip
              key={p.id}
              participant={p}
              active={selectedIds.includes(p.id)}
              onClick={() =>
                setMatchSelection(toggleParticipant(selectedIds, p.id, state.participants))
              }
            />
          ))}
        </div>
      </div>

      {matches.length === 0 && (
        <div
          className="rounded-xl px-[18px] py-[22px] text-center text-[13.5px] leading-relaxed"
          style={{ border: "1px dashed rgba(247,239,221,.35)", color: "rgba(247,239,221,.7)" }}
        >
          Jeszcze żadne imię nie spodobało się wszystkim. Głosujcie dalej — dopasowania pojawią się
          tutaj.
        </div>
      )}

      {matches.map((name) => (
        <MatchCard
          key={name.name}
          name={name}
          selectedParticipants={selectedParticipants}
          votes={state.votes[name.name] ?? {}}
          notes={state.notes[name.name] ?? []}
          surname={surname}
          draft={drafts[name.name] ?? ""}
          onDraftChange={(value) => setDrafts((prev) => ({ ...prev, [name.name]: value }))}
          onAddNote={() => {
            const text = drafts[name.name] ?? "";
            if (!text.trim()) return;
            picker.addNote(name.name, text);
            setDrafts((prev) => ({ ...prev, [name.name]: "" }));
          }}
        />
      ))}
    </div>
  );
}
