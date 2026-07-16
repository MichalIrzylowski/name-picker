"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(15,59,46,.85)" }}
    >
      <div
        className="w-full max-w-80 rounded-2xl p-5"
        style={{ background: "#163F32", border: "1px solid rgba(247,239,221,.28)" }}
      >
        <div className="text-base font-semibold text-foreground">{title}</div>
        <div className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "rgba(247,239,221,.75)" }}>
          {message}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-foreground"
            style={{ background: "rgba(247,239,221,.08)", border: "1px solid rgba(247,239,221,.28)" }}
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl px-4 py-2.5 text-[13px] font-bold"
            style={{ background: "#F2A31B", color: "#0F3B2E" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
