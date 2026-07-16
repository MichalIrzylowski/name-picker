"use client";

import type { TabId } from "./use-name-picker";

const TABS: { id: TabId; label: string }[] = [
  { id: "swipe", label: "Głosuj" },
  { id: "list", label: "Imiona" },
  { id: "shared", label: "Razem" },
  { id: "family", label: "Rodzina" },
];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="flex px-2 pt-[5px]"
      style={{
        background: "#0A2A20",
        borderTop: "1px solid rgba(242,163,27,.35)",
        paddingBottom: "calc(7px + env(safe-area-inset-bottom))",
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="flex flex-1 flex-col items-center gap-px px-1 pb-[5px] pt-[7px] text-[12.5px] font-semibold"
            style={{ color: isActive ? "#F2A31B" : "rgba(247,239,221,.6)" }}
          >
            <span
              className="text-[7px]"
              style={{ color: "#F2A31B", visibility: isActive ? "visible" : "hidden" }}
            >
              ◆
            </span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
