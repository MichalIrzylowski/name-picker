"use client";

import type { Participant } from "@/lib/db";

interface HeaderProps {
  currentUser: Participant;
  onSwitchProfile: () => void;
}

export function Header({ currentUser, onSwitchProfile }: HeaderProps) {
  return (
    <header className="flex items-end justify-between gap-3 px-[18px] pb-2.5 pt-4">
      <div
        className="text-[23px] font-semibold text-foreground"
        style={{ fontFamily: "var(--font-fraunces), serif", letterSpacing: "-0.01em" }}
      >
        Wybieramy imię
      </div>
      <button
        type="button"
        onClick={onSwitchProfile}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground"
        style={{
          background: "rgba(247,239,221,.08)",
          border: "1px solid rgba(247,239,221,.28)",
        }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: currentUser.color }}
        />
        {currentUser.name}
      </button>
    </header>
  );
}
