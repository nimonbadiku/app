"use client";

import React, { useState, useEffect, useCallback, useTransition, useSyncExternalStore } from "react";
import {
  ActiveSession,
  SessionRecord,
  UserSettingsConfig,
} from "@/types";
import {
  loadStoredActiveSession,
  saveActiveSession,
  loadStoredSettings,
  saveStoredSettings,
  loadLocalSessions,
  saveLocalSessions,
  getOfflineQueue,
  addToOfflineQueue,
  clearOfflineQueue,
} from "@/lib/storage";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { DynamicIsland } from "@/components/DynamicIsland";
import { ActiveSessionView } from "@/components/ActiveSessionView";
import { IdleSessionView } from "@/components/IdleSessionView";
import { HistoryView } from "@/components/HistoryView";
import { ProgressView } from "@/components/ProgressView";
import { SettingsView } from "@/components/SettingsView";
import { playSuccess, triggerHaptic } from "@/lib/audio";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function HomePage() {
  const isMounted = useIsClient();
  const [activeTab, setActiveTab] = useState<"SELL" | "HISTORY" | "PROGRESS" | "SETTINGS">("SELL");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() => loadStoredActiveSession());
  const [sessions, setSessions] = useState<SessionRecord[]>(() => loadLocalSessions());
  const [settings, setSettings] = useState<UserSettingsConfig>(() => loadStoredSettings());
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(() => getOfflineQueue().length);
  const [, startTransition] = useTransition();

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark =
      settings.theme === "dark" || (settings.theme === "system" && prefersDark);

    if (shouldBeDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.theme]);

  const refreshSessionsFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success && Array.isArray(data?.sessions)) {
          if (data.offline) {
            const localSaved = loadLocalSessions();
            const queue = getOfflineQueue();
            const byId = new Map<string, SessionRecord>();
            for (const s of [...localSaved, ...queue, ...data.sessions]) byId.set(s.id, s);
            const merged = [...byId.values()].sort(
              (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
            );
            setSessions(merged);
            saveLocalSessions(merged);
          } else {
            setSessions(data.sessions);
            saveLocalSessions(data.sessions);
          }
        }
      }
    } catch (err) {
      console.warn("Could not refresh sessions from server:", err);
    }
  }, []);

  // Sync offline queue to server
  const syncOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) {
      setOfflinePendingCount(0);
      return;
    }

    try {
      let allOk = true;
      for (const item of queue) {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || data?.offline) {
          allOk = false;
          break;
        }
      }
      if (allOk) {
        clearOfflineQueue();
        setOfflinePendingCount(0);
        void refreshSessionsFromServer();
      } else {
        setOfflinePendingCount(queue.length);
      }
    } catch (err) {
      console.warn("Could not sync offline queue yet:", err);
      setOfflinePendingCount(queue.length);
    }
  }, [refreshSessionsFromServer]);

  // Initial server load
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const [settingsRes, sessionsRes] = await Promise.allSettled([
          fetch("/api/settings"),
          fetch("/api/sessions"),
        ]);

        if (!active) return;

        if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
          const data = await settingsRes.value.json().catch(() => null);
          if (data?.success && data?.settings && active) {
            setSettings((prev) => {
              const updated = {
                ...prev,
                earningsPerItem: data.settings.earningsPerItem,
                pricePerItem: data.settings.pricePerItem,
                currency: data.settings.currency,
              };
              saveStoredSettings(updated);
              return updated;
            });
          }
        }

        if (sessionsRes.status === "fulfilled" && sessionsRes.value.ok) {
          const data = await sessionsRes.value.json().catch(() => null);
          if (data?.success && Array.isArray(data?.sessions) && active) {
            if (data.offline) {
              const localSaved = loadLocalSessions();
              const queue = getOfflineQueue();
              const byId = new Map<string, SessionRecord>();
              for (const s of [...localSaved, ...queue, ...data.sessions]) byId.set(s.id, s);
              const merged = [...byId.values()].sort(
                (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
              );
              setSessions(merged);
              saveLocalSessions(merged);
            } else {
              setSessions(data.sessions);
              saveLocalSessions(data.sessions);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load initial data:", err);
      }
    }

    void loadInitialData();

    const handleOnline = () => {
      void syncOfflineQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
    };
  }, [syncOfflineQueue]);

  // START SESSION
  const handleStartSession = (
    experiment: string,
    territory?: string,
    targetDoors?: number
  ) => {
    const newSession: ActiveSession = {
      id: crypto.randomUUID(),
      startedAt: Date.now(),
      doors: 0,
      yesCount: 0,
      noCount: 0,
      notHomeCount: 0,
      itemsSold: 0,
      experiment: experiment.trim() || undefined,
      territory: territory?.trim() || undefined,
      targetDoors: targetDoors || settings.defaultTargetDoors || 40,
      actionHistory: [],
    };

    setActiveSession(newSession);
    saveActiveSession(newSession);
    setActiveTab("SELL");
  };

  // UPDATE ACTIVE SESSION
  const handleUpdateSession = (updated: ActiveSession) => {
    setActiveSession(updated);
    saveActiveSession(updated);
  };

  // END SESSION
  const handleEndSession = async (
    note: string,
    experiment: string,
    territory?: string
  ) => {
    if (!activeSession) return;

    const endedAtMs = Date.now();
    const totalPaused =
      (activeSession.totalPausedMs || 0) +
      (activeSession.isPaused && activeSession.pausedAt
        ? endedAtMs - activeSession.pausedAt
        : 0);

    const durationSeconds = Math.max(
      0,
      Math.floor((endedAtMs - activeSession.startedAt - totalPaused) / 1000)
    );
    const earnings = activeSession.itemsSold * settings.earningsPerItem;

    const record: SessionRecord = {
      id: activeSession.id,
      startedAt: new Date(activeSession.startedAt).toISOString(),
      endedAt: new Date(endedAtMs).toISOString(),
      durationSeconds,
      doors: activeSession.doors,
      yesCount: activeSession.yesCount,
      noCount: activeSession.noCount,
      notHomeCount: activeSession.notHomeCount,
      itemsSold: activeSession.itemsSold,
      earnings,
      currency: settings.currency,
      earningsPerItem: settings.earningsPerItem,
      note: note.trim() || null,
      experiment: experiment.trim() || activeSession.experiment || null,
      territory: territory?.trim() || activeSession.territory || null,
      createdAt: new Date().toISOString(),
    };

    // Update local state and durable local backup
    const nextSessions = [record, ...sessions];
    setSessions(nextSessions);
    saveLocalSessions(nextSessions);

    // Clear active session
    setActiveSession(null);
    saveActiveSession(null);

    // Persist to server or offline queue
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || data?.offline) {
        addToOfflineQueue(record);
        setOfflinePendingCount((c) => c + 1);
      }
    } catch (err) {
      console.warn("Failed to reach server, saving to offline queue:", err);
      addToOfflineQueue(record);
      setOfflinePendingCount((c) => c + 1);
    }

    startTransition(() => {
      setActiveTab("HISTORY");
    });
  };

  // ADD MANUAL SESSION
  const handleAddManualSession = async (record: SessionRecord) => {
    const nextSessions = [record, ...sessions].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    setSessions(nextSessions);
    saveLocalSessions(nextSessions);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || data?.offline) {
        addToOfflineQueue(record);
        setOfflinePendingCount((c) => c + 1);
      }
    } catch {
      addToOfflineQueue(record);
      setOfflinePendingCount((c) => c + 1);
    }
  };

  // UPDATE SESSION METADATA (inline edit from modal)
  const handleUpdateSessionMeta = (
    id: string,
    note: string,
    experiment: string,
    territory?: string
  ) => {
    const updated = sessions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          note: note.trim() || null,
          experiment: experiment.trim() || null,
          territory: territory?.trim() || null,
        };
      }
      return s;
    });

    setSessions(updated);
    saveLocalSessions(updated);

    const target = updated.find((s) => s.id === id);
    if (target) {
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      }).catch(() => {
        addToOfflineQueue(target);
      });
    }
  };

  // SAVE SETTINGS
  const handleSaveSettings = async (newSettings: UserSettingsConfig) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.warn("Could not save settings to server immediately:", err);
    }
  };

  // DELETE SESSION
  const handleDeleteSession = async (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    saveLocalSessions(filtered);

    try {
      const remainingQueue = getOfflineQueue().filter((s) => s.id !== id);
      clearOfflineQueue();
      for (const s of remainingQueue) addToOfflineQueue(s);
      setOfflinePendingCount(remainingQueue.length);
    } catch {
      // ignore local cleanup errors
    }

    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete session on server:", err);
    }
  };

  // CLEAR ALL DATA
  const handleClearData = async () => {
    try {
      for (const s of sessions) {
        await fetch(`/api/sessions/${s.id}`, { method: "DELETE" });
      }
      clearOfflineQueue();
      setOfflinePendingCount(0);
      setSessions([]);
      saveLocalSessions([]);
    } catch (err) {
      console.error("Failed to clear data:", err);
    }
  };

  // GENERATE REALISTIC DEMO DATA
  const handleGenerateDemoData = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const demoSessions: SessionRecord[] = [
      {
        id: crypto.randomUUID(),
        startedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
        endedAt: new Date(now - 1 * 3600 * 1000).toISOString(),
        durationSeconds: 3600,
        doors: 38,
        yesCount: 6,
        noCount: 22,
        notHomeCount: 10,
        itemsSold: 9,
        earnings: 9 * settings.earningsPerItem,
        currency: settings.currency,
        earningsPerItem: settings.earningsPerItem,
        territory: "Oakridge Estate",
        experiment: "2-Question Hook",
        note: "High energy day, sunny weather, lots of people home.",
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        startedAt: new Date(now - oneDay - 4 * 3600 * 1000).toISOString(),
        endedAt: new Date(now - oneDay - 2 * 3600 * 1000).toISOString(),
        durationSeconds: 7200,
        doors: 72,
        yesCount: 11,
        noCount: 43,
        notHomeCount: 18,
        itemsSold: 16,
        earnings: 16 * settings.earningsPerItem,
        currency: settings.currency,
        earningsPerItem: settings.earningsPerItem,
        territory: "Maplewood North",
        experiment: "Problem-First Pitch",
        note: "Great rhythm, tested shorter opener with high close rate.",
        createdAt: new Date(now - oneDay).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        startedAt: new Date(now - 2 * oneDay - 3 * 3600 * 1000).toISOString(),
        endedAt: new Date(now - 2 * oneDay - 1.5 * 3600 * 1000).toISOString(),
        durationSeconds: 5400,
        doors: 55,
        yesCount: 8,
        noCount: 32,
        notHomeCount: 15,
        itemsSold: 12,
        earnings: 12 * settings.earningsPerItem,
        currency: settings.currency,
        earningsPerItem: settings.earningsPerItem,
        territory: "Highland Heights",
        experiment: "Friendly Neighbor",
        note: "Mentioned local references, built immediate trust.",
        createdAt: new Date(now - 2 * oneDay).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        startedAt: new Date(now - 3 * oneDay - 5 * 3600 * 1000).toISOString(),
        endedAt: new Date(now - 3 * oneDay - 3 * 3600 * 1000).toISOString(),
        durationSeconds: 7200,
        doors: 64,
        yesCount: 9,
        noCount: 39,
        notHomeCount: 16,
        itemsSold: 14,
        earnings: 14 * settings.earningsPerItem,
        currency: settings.currency,
        earningsPerItem: settings.earningsPerItem,
        territory: "Valley View Sector",
        experiment: "Direct Value Hook",
        note: "Rainy morning, afternoon picked up heavily.",
        createdAt: new Date(now - 3 * oneDay).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        startedAt: new Date(now - 5 * oneDay - 2 * 3600 * 1000).toISOString(),
        endedAt: new Date(now - 5 * oneDay - 0.8 * 3600 * 1000).toISOString(),
        durationSeconds: 4320,
        doors: 45,
        yesCount: 7,
        noCount: 26,
        notHomeCount: 12,
        itemsSold: 10,
        earnings: 10 * settings.earningsPerItem,
        currency: settings.currency,
        earningsPerItem: settings.earningsPerItem,
        territory: "Downtown Rowhouses",
        experiment: "Weekend Special",
        note: "Fast knock cadence.",
        createdAt: new Date(now - 5 * oneDay).toISOString(),
      },
    ];

    setSessions(demoSessions);
    saveLocalSessions(demoSessions);
    playSuccess(settings.soundEnabled);
    triggerHaptic("success", settings.hapticsEnabled);
  };

  // IMPORT JSON BACKUP
  const handleImportJSON = (imported: SessionRecord[]) => {
    const byId = new Map<string, SessionRecord>();
    for (const s of [...imported, ...sessions]) byId.set(s.id, s);
    const merged = [...byId.values()].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    setSessions(merged);
    saveLocalSessions(merged);
  };

  // Toggle Theme helper
  const handleToggleTheme = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    handleSaveSettings({ ...settings, theme: nextTheme });
  };

  // Toggle Sound helper
  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    handleSaveSettings({ ...settings, soundEnabled: next });
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black transition-colors">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white animate-spin"></div>
          <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500 font-mono">
            DoorTrack
          </span>
        </div>
      </div>
    );
  }

  const isSelling = activeSession !== null;
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top iOS Header */}
      <Header
        isSelling={isSelling}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setActiveTab("SETTINGS")}
        experiment={activeSession?.experiment}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Floating Dynamic Island Live Pill (when browsing tabs during active route) */}
      {isSelling && activeTab !== "SELL" && activeSession && (
        <div className="sticky top-14 z-30 pt-1 px-4">
          <DynamicIsland
            isSelling={isSelling}
            isPaused={activeSession.isPaused}
            startedAt={activeSession.startedAt}
            totalPausedMs={activeSession.totalPausedMs}
            doors={activeSession.doors}
            earnings={activeSession.itemsSold * settings.earningsPerItem}
            currency={settings.currency}
            onExpand={() => setActiveTab("SELL")}
            targetDoors={activeSession.targetDoors}
          />
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-md mx-auto relative">
        {activeTab === "SELL" ? (
          isSelling ? (
            <ActiveSessionView
              session={activeSession}
              settings={settings}
              onUpdateSession={handleUpdateSession}
              onEndSession={handleEndSession}
            />
          ) : (
            <IdleSessionView
              onStartSession={handleStartSession}
              lastSession={lastSession}
              totalSessionsCount={sessions.length}
              settings={settings}
              onViewHistory={() => setActiveTab("HISTORY")}
              allSessions={sessions}
            />
          )
        ) : activeTab === "HISTORY" ? (
          <HistoryView
            sessions={sessions}
            settings={settings}
            onDeleteSession={handleDeleteSession}
            onStartRouteClick={() => setActiveTab("SELL")}
            onAddManualSession={handleAddManualSession}
            onUpdateSessionMeta={handleUpdateSessionMeta}
            onGenerateDemoData={handleGenerateDemoData}
          />
        ) : activeTab === "PROGRESS" ? (
          <ProgressView sessions={sessions} settings={settings} />
        ) : (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            sessions={sessions}
            onClearData={handleClearData}
            onSyncOffline={syncOfflineQueue}
            offlinePendingCount={offlinePendingCount}
            onGenerateDemoData={handleGenerateDemoData}
            onImportJSON={handleImportJSON}
          />
        )}
      </main>

      {/* Persistent iOS Bottom Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isSelling={isSelling}
        soundEnabled={settings.soundEnabled}
      />
    </div>
  );
}
