"use client";

import type { Participant } from "@/lib/db";

interface OnboardingProps {
  participants: Participant[];
  newName: string;
  onNewNameChange: (value: string) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function Onboarding({
  participants,
  newName,
  onNewNameChange,
  onSelect,
  onAdd,
}: OnboardingProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-7 py-8">
      <div className="text-center">
        <div
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-fraunces), serif", letterSpacing: "-0.01em" }}
        >
          Wybieramy imię
        </div>
        <div
          className="mt-1.5 text-[10.5px] uppercase"
          style={{ letterSpacing: ".16em", color: "rgba(242,163,27,.9)" }}
        >
          kim jesteś?
        </div>
      </div>

      <div className="flex w-full max-w-80 flex-col gap-2.5">
        {participants.map((participant) => (
          <button
            key={participant.id}
            type="button"
            onClick={() => onSelect(participant.id)}
            className="flex items-center gap-3 rounded-[14px] px-[18px] py-[15px] text-left text-base font-semibold text-foreground"
            style={{
              background: "rgba(247,239,221,.08)",
              border: "1px solid rgba(247,239,221,.28)",
            }}
          >
            <span
              className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
              style={{ background: participant.color }}
            />
            {participant.name}
          </button>
        ))}

        <div className="mt-1 flex gap-2">
          <input
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder="Jestem kimś innym…"
            className="min-w-0 flex-1 rounded-xl px-3.5 py-3 text-sm text-foreground"
            style={{
              background: "rgba(247,239,221,.08)",
              border: "1px solid rgba(247,239,221,.3)",
            }}
          />
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl px-4 py-3 text-[13px] font-bold"
            style={{ background: "#F2A31B", color: "#0F3B2E" }}
          >
            Dołącz
          </button>
        </div>
      </div>

      <div
        className="max-w-[300px] text-center text-[11px] leading-relaxed"
        style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", color: "rgba(247,239,221,.55)" }}
      >
        To urządzenie zapamięta Twój wybór.
        <br />
        Głosujesz zawsze jako Ty.
      </div>
    </div>
  );
}
