"use client";

import { useEffect, useRef, useState } from "react";
import type { Participant } from "@/lib/db";
import type { UseNamePicker } from "./use-name-picker";
import { ConfirmModal } from "./ConfirmModal";

interface FamilyTabProps {
  picker: UseNamePicker;
}

function ParticipantRow({
  participant,
  onRemove,
}: {
  participant: Participant;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[14px] px-[18px] py-[15px]"
      style={{ background: "rgba(247,239,221,.08)", border: "1px solid rgba(247,239,221,.28)" }}
    >
      <span
        className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
        style={{ background: participant.color }}
      />
      <span className="flex-1 text-base font-semibold text-foreground">{participant.name}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Usuń ${participant.name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: "rgba(194,67,40,.18)", color: "#E07A5F" }}
      >
        ✕
      </button>
    </div>
  );
}

export function FamilyTab({ picker }: FamilyTabProps) {
  const [newName, setNewName] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Participant | null>(null);

  const [surnameDraft, setSurnameDraft] = useState(picker.familyState?.surname ?? "");
  const surnameFocused = useRef(false);

  // Keep the surname field in sync with polled state, but never clobber an
  // in-progress edit on this device.
  useEffect(() => {
    if (surnameFocused.current) return;
    setSurnameDraft(picker.familyState?.surname ?? "");
  }, [picker.familyState?.surname]);

  const participants = picker.familyState?.participants ?? [];

  const commitSurname = () => {
    surnameFocused.current = false;
    if (surnameDraft !== (picker.familyState?.surname ?? "")) {
      picker.setSurname(surnameDraft);
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    picker.addFamilyMember(newName);
    setNewName("");
  };

  const isSelf = removeTarget?.id === picker.currentUser?.id;

  return (
    <div className="flex flex-col gap-6 px-[18px] py-6">
      <div>
        <div
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Rodzina
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {participants.map((participant) => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              onRemove={() => setRemoveTarget(participant)}
            />
          ))}
        </div>

        <div className="mt-2.5 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dodaj osobę…"
            className="min-w-0 flex-1 rounded-xl px-3.5 py-3 text-sm text-foreground"
            style={{ background: "rgba(247,239,221,.08)", border: "1px solid rgba(247,239,221,.3)" }}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-xl px-4 py-3 text-[13px] font-bold"
            style={{ background: "#F2A31B", color: "#0F3B2E" }}
          >
            Dodaj
          </button>
        </div>
      </div>

      <div>
        <div
          className="text-[10.5px] font-semibold uppercase"
          style={{ letterSpacing: ".16em", color: "rgba(242,163,27,.9)" }}
        >
          Nazwisko
        </div>
        <input
          value={surnameDraft}
          onChange={(e) => setSurnameDraft(e.target.value)}
          onFocus={() => {
            surnameFocused.current = true;
          }}
          onBlur={commitSurname}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="Nazwisko rodziny"
          className="mt-2 w-full rounded-xl px-3.5 py-3 text-sm text-foreground"
          style={{ background: "rgba(247,239,221,.08)", border: "1px solid rgba(247,239,221,.3)" }}
        />
      </div>

      {removeTarget && (
        <ConfirmModal
          title={isSelf ? "Usunąć siebie?" : `Usunąć ${removeTarget.name}?`}
          message={
            isSelf
              ? "Wrócisz do ekranu wyboru osoby. Twoje głosy i notatki znikną."
              : `Głosy i notatki ${removeTarget.name} znikną. Tej operacji nie można cofnąć.`
          }
          confirmLabel="Usuń"
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            picker.removeParticipant(removeTarget.id);
            setRemoveTarget(null);
          }}
        />
      )}
    </div>
  );
}
