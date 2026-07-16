"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NameApiItem } from "@/lib/names";
import type { FamilyState, Participant, VoteValue } from "@/lib/db";

const CURRENT_USER_STORAGE_KEY = "namePicker.currentUserId";
const STATE_POLL_INTERVAL_MS = 5000;

/** Fire-and-forget mutation: local state is already updated optimistically by the caller. */
function sendMutation(
  url: string,
  init: RequestInit,
  setError: (message: string | null) => void,
  errorMessage: string,
): void {
  fetch(url, init)
    .then((res) => {
      if (!res.ok) throw new Error(errorMessage);
      setError(null);
    })
    .catch(() => setError(errorMessage));
}

export type TabId = "swipe" | "list" | "shared" | "family";
export type GenderFilter = "all" | "M" | "K";
export type PopularityFilter = "all" | "pop" | "mid" | "rare";

export interface UseNamePicker {
  // Loading / errors
  stateLoaded: boolean;
  namesLoaded: boolean;
  error: string | null;

  // Data
  names: NameApiItem[];
  familyState: FamilyState | null;
  currentUser: Participant | null;

  // Onboarding
  onboardingNewName: string;
  setOnboardingNewName: (value: string) => void;
  selectParticipant: (id: string) => void;
  addParticipant: (name: string) => Promise<void>;

  // Profile switching
  switchProfileOpen: boolean;
  askSwitchProfile: () => void;
  cancelSwitchProfile: () => void;
  confirmSwitchProfile: () => void;

  // Shell navigation
  tab: TabId;
  setTab: (tab: TabId) => void;

  // List/deck filters
  search: string;
  setSearch: (value: string) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (value: GenderFilter) => void;
  popularityFilter: PopularityFilter;
  setPopularityFilter: (value: PopularityFilter) => void;

  // Swipe card state
  swipeAnim: VoteValue | null;
  noteOpen: boolean;
  setNoteOpen: (open: boolean) => void;
  noteDraft: string;
  setNoteDraft: (value: string) => void;

  // Shared-tab match selection
  matchSelection: string[] | null;
  setMatchSelection: (ids: string[] | null) => void;

  // Family-tab name scope
  nameScope: GenderFilter;
  setNameScope: (value: GenderFilter) => void;

  // Mutations
  castVote: (nameId: string, value: VoteValue) => void;
  addNote: (nameId: string, text: string) => void;
  setSurname: (surname: string) => void;
  removeParticipant: (id: string) => void;
}

export function useNamePicker(): UseNamePicker {
  const [tab, setTab] = useState<TabId>("swipe");
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(CURRENT_USER_STORAGE_KEY),
  );
  const [error, setError] = useState<string | null>(null);

  const [names, setNames] = useState<NameApiItem[]>([]);
  const [namesLoaded, setNamesLoaded] = useState(false);

  const [familyState, setFamilyState] = useState<FamilyState | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);
  const hasValidatedInitialUser = useRef(false);

  const [onboardingNewName, setOnboardingNewName] = useState("");
  const [switchProfileOpen, setSwitchProfileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [popularityFilter, setPopularityFilter] = useState<PopularityFilter>("all");

  const [swipeAnim] = useState<VoteValue | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const [matchSelection, setMatchSelection] = useState<string[] | null>(null);
  const [nameScope, setNameScope] = useState<GenderFilter>("all");

  // Names are fetched once — they only change on re-seed, never on user activity.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/names")
      .then((res) => {
        if (!res.ok) throw new Error("names fetch failed");
        return res.json() as Promise<NameApiItem[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setNames(data);
        setNamesLoaded(true);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Nie udało się pobrać listy imion.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchState = useCallback(() => {
    fetch("/api/state")
      .then((res) => {
        if (!res.ok) throw new Error("state fetch failed");
        return res.json() as Promise<FamilyState>;
      })
      .then((data) => {
        setFamilyState(data);
        setStateLoaded(true);
        setError(null);
      })
      .catch(() => {
        setError("Nie udało się połączyć z serwerem.");
      });
  }, []);

  // Family state is polled while the tab is visible, paused when hidden.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval || document.visibilityState !== "visible") return;
      interval = setInterval(fetchState, STATE_POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchState();
        start();
      } else {
        stop();
      }
    };

    fetchState();
    start();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchState]);

  // A stored currentUserId is validated once, against the first state that
  // arrives — not on every poll, so a removal elsewhere only takes effect for
  // this device after it reloads. `currentUser` (derived below) already reads
  // as null once this id no longer matches any Participant; this effect only
  // needs to clean up the now-stale localStorage entry, an external system.
  useEffect(() => {
    if (!stateLoaded || hasValidatedInitialUser.current) return;
    hasValidatedInitialUser.current = true;

    if (currentUserId && !familyState?.participants.some((p) => p.id === currentUserId)) {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, [stateLoaded, familyState, currentUserId]);

  const selectParticipant = useCallback((id: string) => {
    setCurrentUserId(id);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, id);
  }, []);

  const addParticipant = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("add participant failed");
      const participant: Participant = await res.json();

      setFamilyState((prev) =>
        prev ? { ...prev, participants: [...prev.participants, participant] } : prev,
      );
      setCurrentUserId(participant.id);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, participant.id);
      setOnboardingNewName("");
      setError(null);
    } catch {
      setError("Nie udało się dodać osoby.");
    }
  }, []);

  const askSwitchProfile = useCallback(() => setSwitchProfileOpen(true), []);
  const cancelSwitchProfile = useCallback(() => setSwitchProfileOpen(false), []);
  const confirmSwitchProfile = useCallback(() => {
    setCurrentUserId(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    setSwitchProfileOpen(false);
    setTab("swipe");
  }, []);

  const castVote = useCallback(
    (nameId: string, value: VoteValue) => {
      if (!currentUserId) return;

      setFamilyState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          votes: {
            ...prev.votes,
            [nameId]: { ...prev.votes[nameId], [currentUserId]: value },
          },
        };
      });

      sendMutation(
        "/api/votes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameId, participantId: currentUserId, value }),
        },
        setError,
        "Nie udało się zapisać głosu.",
      );
    },
    [currentUserId],
  );

  const addNote = useCallback(
    (nameId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !currentUserId) return;

      setFamilyState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: {
            ...prev.notes,
            [nameId]: [...(prev.notes[nameId] ?? []), { authorId: currentUserId, text: trimmed }],
          },
        };
      });

      sendMutation(
        "/api/notes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameId, authorId: currentUserId, text: trimmed }),
        },
        setError,
        "Nie udało się zapisać notatki.",
      );
    },
    [currentUserId],
  );

  const setSurname = useCallback((surname: string) => {
    setFamilyState((prev) => (prev ? { ...prev, surname } : prev));

    sendMutation(
      "/api/settings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname }),
      },
      setError,
      "Nie udało się zapisać nazwiska.",
    );
  }, []);

  const removeParticipant = useCallback(
    (id: string) => {
      setFamilyState((prev) =>
        prev ? { ...prev, participants: prev.participants.filter((p) => p.id !== id) } : prev,
      );
      if (currentUserId === id) {
        setCurrentUserId(null);
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }

      sendMutation(
        `/api/participants/${id}`,
        { method: "DELETE" },
        setError,
        "Nie udało się usunąć osoby.",
      );
    },
    [currentUserId],
  );

  const currentUser = familyState?.participants.find((p) => p.id === currentUserId) ?? null;

  return {
    stateLoaded,
    namesLoaded,
    error,

    names,
    familyState,
    currentUser,

    onboardingNewName,
    setOnboardingNewName,
    selectParticipant,
    addParticipant,

    switchProfileOpen,
    askSwitchProfile,
    cancelSwitchProfile,
    confirmSwitchProfile,

    tab,
    setTab,

    search,
    setSearch,
    genderFilter,
    setGenderFilter,
    popularityFilter,
    setPopularityFilter,

    swipeAnim,
    noteOpen,
    setNoteOpen,
    noteDraft,
    setNoteDraft,

    matchSelection,
    setMatchSelection,

    nameScope,
    setNameScope,

    castVote,
    addNote,
    setSurname,
    removeParticipant,
  };
}
