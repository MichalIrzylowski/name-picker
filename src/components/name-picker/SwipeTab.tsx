"use client";

import { useMemo, useRef, useState } from "react";
import { unvoted } from "@/lib/deck";
import { displayName, EMOJI, TREND } from "@/lib/names";
import type { NameApiItem } from "@/lib/names";
import type { UseNamePicker } from "./use-name-picker";
import type { VoteValue } from "@/lib/db";

const COMMIT_THRESHOLD_PX = 90;
const FLY_OFF_MS = 300;

const FLY_OFF_TRANSFORM: Record<VoteValue, string> = {
  love: "translateX(130%) rotate(10deg)",
  no: "translateX(-130%) rotate(-10deg)",
  maybe: "translateY(-130%) rotate(2deg)",
};

function formatRegisterCount(count: number): string {
  return "≈ " + count.toLocaleString("pl-PL") + " osób";
}

interface SwipeTabProps {
  picker: UseNamePicker;
}

export function SwipeTab({ picker }: SwipeTabProps) {
  const { names, familyState, currentUser, deckOrder, swipeAnim, setSwipeAnim, noteOpen, setNoteOpen, noteDraft, setNoteDraft } = picker;

  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const namesByName = useMemo(() => {
    const map = new Map<string, NameApiItem>();
    for (const n of names) map.set(n.name, n);
    return map;
  }, [names]);

  if (!currentUser || !familyState) return null;

  const votes = familyState.votes;
  const orderedDeck = deckOrder.map((name) => namesByName.get(name)).filter((n): n is NameApiItem => !!n);
  const remaining = unvoted(orderedDeck, votes, currentUser.id);
  const total = orderedDeck.length;
  const rated = total - remaining.length;
  const current = remaining[0] ?? null;

  function commit(value: VoteValue) {
    if (!current || swipeAnim) return;
    setSwipeAnim(value);
    setDrag(null);
    setTimeout(() => {
      picker.castVote(current.name, value);
      setSwipeAnim(null);
      setNoteOpen(false);
      setNoteDraft("");
    }, FLY_OFF_MS);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (noteOpen || swipeAnim || !current) return;
    // Don't hijack clicks on the note button/input beneath the drag surface.
    if ((e.target as HTMLElement).closest("button, input")) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    setDrag({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }

  function onPointerUp() {
    if (!dragStart.current) return;
    dragStart.current = null;
    const offset = drag;
    if (!offset) return;

    const { x, y } = offset;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    if (x > COMMIT_THRESHOLD_PX && absX > absY) {
      commit("love");
    } else if (x < -COMMIT_THRESHOLD_PX && absX > absY) {
      commit("no");
    } else if (y < -COMMIT_THRESHOLD_PX && absY > absX) {
      commit("maybe");
    } else {
      setDrag(null);
    }
  }

  const cardTransform = swipeAnim
    ? FLY_OFF_TRANSFORM[swipeAnim]
    : drag
      ? `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 20}deg)`
      : "none";
  const cardOpacity = swipeAnim ? 0 : 1;
  const cardTransition = swipeAnim ? "transform .3s ease, opacity .3s ease" : "none";

  const notesForCurrent = current ? (familyState.notes[current.name] ?? []) : [];
  const noteAuthorName = (authorId: string) =>
    familyState.participants.find((p) => p.id === authorId)?.name ?? authorId;
  const noteAuthorColor = (authorId: string) =>
    familyState.participants.find((p) => p.id === authorId)?.color ?? "#8A7A5F";

  const surname = familyState.surname.trim();
  const isGirl = current?.gender === "K";

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 px-6 py-2.5">
      {current ? (
        <>
          <div className="relative w-full max-w-[340px]">
            <div
              className="absolute rounded-[14px]"
              style={{ inset: "12px -8px -8px 8px", background: "rgba(247,239,221,.16)", transform: "rotate(2.2deg)" }}
            />
            <div
              className="absolute rounded-[14px]"
              style={{ inset: "12px 8px -8px -8px", background: "rgba(247,239,221,.10)", transform: "rotate(-2.4deg)" }}
            />
            <div
              className="relative touch-none select-none"
              style={{
                filter: "drop-shadow(0 14px 28px rgba(0,0,0,.35))",
                transition: cardTransition,
                transform: cardTransform,
                opacity: cardOpacity,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className="h-[9px]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle 9px at 9px 9px, #F7EFDD 98%, rgba(0,0,0,0))",
                  backgroundSize: "18px 9px",
                  backgroundRepeat: "repeat-x",
                }}
              />
              <div className="px-[22px] pb-[18px] pt-4" style={{ background: "#F7EFDD", color: "#2A2118" }}>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-full px-[11px] py-1 text-[11px] font-semibold uppercase"
                    style={{
                      letterSpacing: ".08em",
                      background: isGirl ? "rgba(217,72,43,.13)" : "rgba(47,107,82,.14)",
                      color: isGirl ? "#C24328" : "#2F6B52",
                    }}
                  >
                    {isGirl ? "dziewczynka" : "chłopiec"}
                  </span>
                  <span
                    className="text-[10px] uppercase"
                    style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", letterSpacing: ".06em", color: "#8A7A5F" }}
                  >
                    {current.popularity}
                  </span>
                </div>

                <div className="mt-4 mb-0.5 text-center">
                  <div
                    className="text-[46px] font-semibold leading-[1.05]"
                    style={{ fontFamily: "var(--font-fraunces), serif", letterSpacing: "-0.02em", color: "#0F3B2E" }}
                  >
                    {displayName(current.name)}
                  </div>
                  {surname && (
                    <div
                      className="mt-1.5 text-[19px] italic"
                      style={{ fontFamily: "var(--font-fraunces), serif", color: "#8A7A5F" }}
                    >
                      {displayName(current.name)} {surname}
                    </div>
                  )}
                </div>

                <div className="my-3.5 text-center text-[9px]" style={{ letterSpacing: ".45em" }}>
                  <span style={{ color: "#D9482B" }}>◆</span>
                  <span style={{ color: "#F2A31B" }}>◆</span>
                  <span style={{ color: "#4C7FB8" }}>◆</span>
                </div>

                <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
                  <div>
                    <div
                      className="mb-0.5 text-[10px] font-semibold uppercase"
                      style={{ letterSpacing: ".12em", color: "#B49E77" }}
                    >
                      W Polsce
                    </div>
                    <div className="text-[13px]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                      {formatRegisterCount(current.registerCount)}
                    </div>
                    <div className="mt-px text-[10px]" style={{ color: "#B49E77" }}>
                      wg rejestru PESEL
                    </div>
                  </div>
                  <div>
                    <div
                      className="mb-0.5 text-[10px] font-semibold uppercase"
                      style={{ letterSpacing: ".12em", color: "#B49E77" }}
                    >
                      Trend
                    </div>
                    {current.trend ? (
                      <div className="text-[13px] font-semibold" style={{ color: TREND[current.trend].color }}>
                        {TREND[current.trend].glyph} {TREND[current.trend].label}
                      </div>
                    ) : (
                      <div className="text-[13px]" style={{ color: "#8A7A5F" }}>
                        —
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5" style={{ borderTop: "1px dashed #D9C9A8" }}>
                  {notesForCurrent.map((note, i) => (
                    <div key={i} className="mb-1.5 flex items-baseline gap-1.5 text-[12.5px]" style={{ color: "#5A4C3A" }}>
                      <span className="whitespace-nowrap font-semibold" style={{ color: noteAuthorColor(note.authorId) }}>
                        {noteAuthorName(note.authorId)}:
                      </span>
                      <span className="italic">{note.text}</span>
                    </div>
                  ))}
                  {noteOpen ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="np. tak miała na imię prababcia"
                        className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-[13px]"
                        style={{ border: "1px solid #D9C9A8", background: "#FFFDF6", color: "#2A2118" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          picker.addNote(current.name, noteDraft);
                          setNoteDraft("");
                          setNoteOpen(false);
                        }}
                        className="rounded-lg px-3 py-2 text-[12.5px] font-semibold"
                        style={{ background: "#0F3B2E", color: "#F7EFDD" }}
                      >
                        Zapisz
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNoteOpen(true)}
                      className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold underline"
                      style={{ color: "#C24328", textUnderlineOffset: "3px" }}
                    >
                      + dodaj notatkę
                    </button>
                  )}
                </div>
              </div>
              <div
                className="h-[9px]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle 9px at 9px 0px, #F7EFDD 98%, rgba(0,0,0,0))",
                  backgroundSize: "18px 9px",
                  backgroundRepeat: "repeat-x",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4.5">
            <button
              type="button"
              onClick={() => commit("no")}
              className="flex h-[58px] w-[58px] cursor-pointer items-center justify-center rounded-full text-xl"
              style={{ border: "2px solid #C24328", background: "#F7EFDD", boxShadow: "0 6px 14px rgba(0,0,0,.28)" }}
            >
              {EMOJI.no}
            </button>
            <button
              type="button"
              onClick={() => commit("maybe")}
              className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full text-[19px]"
              style={{ border: "2px solid #F2A31B", background: "#F7EFDD", boxShadow: "0 6px 14px rgba(0,0,0,.28)" }}
            >
              {EMOJI.maybe}
            </button>
            <button
              type="button"
              onClick={() => commit("love")}
              className="flex h-[70px] w-[70px] cursor-pointer items-center justify-center rounded-full text-[28px]"
              style={{ border: "3px solid #2F6B52", background: "#F7EFDD", boxShadow: "0 8px 18px rgba(0,0,0,.32)" }}
            >
              {EMOJI.love}
            </button>
          </div>
          <div
            className="text-center text-[11.5px]"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", color: "rgba(247,239,221,.7)" }}
          >
            {rated} z {total}
          </div>
        </>
      ) : total === 0 ? null : (
        <div className="w-full max-w-[340px]" style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,.32))" }}>
          <div
            className="h-[9px]"
            style={{
              backgroundImage: "radial-gradient(circle 9px at 9px 9px, #F7EFDD 98%, rgba(0,0,0,0))",
              backgroundSize: "18px 9px",
              backgroundRepeat: "repeat-x",
            }}
          />
          <div className="px-6 py-[26px] text-center" style={{ background: "#F7EFDD", color: "#2A2118" }}>
            <div className="text-[28px] font-semibold" style={{ fontFamily: "var(--font-fraunces), serif", color: "#0F3B2E" }}>
              To już wszystkie imiona
            </div>
            <div className="my-2.5 text-[13.5px] leading-relaxed" style={{ color: "#5A4C3A" }}>
              Oceniliście każde imię z listy. Zobaczcie, które podobają się całej rodzinie.
            </div>
            <button
              type="button"
              onClick={() => picker.setTab("shared")}
              className="cursor-pointer rounded-full px-5 py-[11px] text-sm font-semibold"
              style={{ border: 0, background: "#C24328", color: "#F7EFDD" }}
            >
              Zobacz wspólne typy
            </button>
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
      )}
    </div>
  );
}
