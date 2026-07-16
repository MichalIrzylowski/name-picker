"use client";

import { useNamePicker, type TabId, type UseNamePicker } from "./use-name-picker";
import { Onboarding } from "./Onboarding";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

const TAB_PLACEHOLDER_LABEL: Record<TabId, string> = {
  swipe: "Głosuj — wkrótce",
  list: "Imiona — wkrótce",
  shared: "Razem — wkrótce",
  family: "Rodzina — wkrótce",
};

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

  return (
    <>
      <Header currentUser={picker.currentUser} onGoFamily={() => picker.setTab("family")} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full items-center justify-center p-6 text-center text-sm opacity-70">
          {TAB_PLACEHOLDER_LABEL[picker.tab]}
        </div>
      </main>
      <BottomNav active={picker.tab} onChange={picker.setTab} />
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
