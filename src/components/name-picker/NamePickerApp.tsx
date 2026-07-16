"use client";

import { useNamePicker, type UseNamePicker } from "./use-name-picker";
import { computeMatches, resolveSelection } from "@/lib/matches";
import { Onboarding } from "./Onboarding";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { SwipeTab } from "./SwipeTab";
import { ListTab } from "./ListTab";
import { SharedTab } from "./SharedTab";
import { FamilyTab } from "./FamilyTab";
import { ConfirmModal } from "./ConfirmModal";

const SHELL_STYLE: React.CSSProperties = {
  backgroundImage: "radial-gradient(rgba(247,239,221,0.055) 1.4px, rgba(0,0,0,0) 1.5px)",
  backgroundSize: "24px 24px",
};

function Body({ picker }: { picker: UseNamePicker }) {
  if (!picker.stateLoaded) return null;

  if (!picker.currentUser) {
    return (
      <Onboarding
        participants={picker.familyState?.participants ?? []}
        newName={picker.onboardingNewName}
        onNewNameChange={picker.setOnboardingNewName}
        onSelect={picker.selectParticipant}
        onAdd={() => picker.addParticipant(picker.onboardingNewName)}
      />
    );
  }

  const matchCount = picker.familyState
    ? computeMatches(
        picker.names,
        picker.familyState.votes,
        resolveSelection(picker.familyState.participants, picker.matchSelection),
      ).length
    : 0;

  return (
    <>
      <Header currentUser={picker.currentUser} onSwitchProfile={picker.askSwitchProfile} />
      <main
        className={`flex-1 overflow-x-hidden ${picker.tab === "list" ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {picker.tab === "swipe" ? (
          <SwipeTab picker={picker} />
        ) : picker.tab === "list" ? (
          <ListTab picker={picker} />
        ) : picker.tab === "shared" ? (
          <SharedTab picker={picker} />
        ) : (
          <FamilyTab picker={picker} />
        )}
      </main>
      <BottomNav active={picker.tab} onChange={picker.setTab} matchCount={matchCount} />
      {picker.switchProfileOpen && (
        <ConfirmModal
          title="Zmienić profil?"
          message="Wrócisz do ekranu wyboru osoby. Nikt nie zostanie usunięty."
          confirmLabel="Zmień"
          onCancel={picker.cancelSwitchProfile}
          onConfirm={picker.confirmSwitchProfile}
        />
      )}
    </>
  );
}

export function NamePickerApp() {
  const picker = useNamePicker();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground" style={SHELL_STYLE}>
      {picker.error && (
        <div
          role="alert"
          className="px-4 py-2 text-center text-xs font-semibold text-foreground"
          style={{ background: "#C24328" }}
        >
          {picker.error}
        </div>
      )}
      <Body picker={picker} />
    </div>
  );
}
