"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  getOfflineQueue,
  addToOfflineQueue,
  clearOfflineQueue,
} from "@/lib/storage";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ActiveSessionView } from "@/components/ActiveSessionView";
import { IdleSessionView } from "@/components/IdleSessionView";
import { HistoryView } from "@/components/HistoryView";
import { ProgressView } from "@/components/ProgressView";
import { SettingsView } from "@/components/SettingsView";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"SELL" | "HISTORY" | "PROGRESS" | "SETTINGS">("SELL");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [settings, setSettings] = useState<UserSettingsConfig>({
    earningsPerItem: 20,
    pricePerItem: 50,
    currency: "kr",
  });
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

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
        // Offline-only backend echoes { success: true, offline: true } without
        // persisting — keep the queue so sessions aren't lost on refresh.
        if (!res.ok || !data?.success || data?.offline) {
          allOk = false;
          break;
        }
      }
      if (allOk) {
        clearOfflineQueue();
        setOfflinePendingCount(0);
        // Refresh sessions
        fetchSessions();
      } else {
        setOfflinePendingCount(queue.length);
      }
    } catch (err) {
      console.warn("Could not sync offline queue yet, network might still be offline", err);
      setOfflinePendingCount(queue.length);
    }
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          // Fresh start: never auto-seed demo data. Empty means empty.
          // In offline-only mode the server returns [], so merge the durable
          // local offline queue (the real source of truth without a DB).
          if (data.offline) {
            const queue = getOfflineQueue();
            const byId = new Map<string, SessionRecord>();
            for (const s of [...queue, ...data.sessions]) byId.set(s.id, s);
            const merged = [...byId.values()].sort(
              (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
            );
            setSessions(merged);
          } else {
            setSessions(data.sessions);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load sessions from server:", err);
      // Last resort: show locally queued sessions so nothing looks lost.
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        setSessions(
          [...queue].sort(
            (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          )
        );
      }
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
          saveStoredSettings(data.settings);
        }
      }
    } catch (err) {
      console.warn("Using locally cached settings:", err);
    }
  };

  // Initial client setup
  useEffect(() => {
    // 1. Load active session from local storage (handles refresh, tab switch, app restart)
    const storedActive = loadStoredActiveSession();
    if (storedActive) {
      setActiveSession(storedActive);
    }

    // 2. Load settings from local storage
    const storedSettings = loadStoredSettings();
    setSettings(storedSettings);

    // 3. Check offline queue count
    const queue = getOfflineQueue();
    setOfflinePendingCount(queue.length);

    // 4. Fetch server data
    fetchSettings();
    fetchSessions();

    setIsLoaded(true);

    // 5. Offline / Online event listeners
    const handleOnline = () => {
      syncOfflineQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [syncOfflineQueue]);

  // START SESSION
  const handleStartSession = (experiment: string) => {
    // Exact timestamp ms - survive backgrounding / locking
    const newSession: ActiveSession = {
      id: crypto.randomUUID(),
      startedAt: Date.now(),
      doors: 0,
      yesCount: 0,
      noCount: 0,
      notHomeCount: 0,
      itemsSold: 0,
      experiment: experiment.trim() || undefined,
      actionHistory: [],
    };

    setActiveSession(newSession);
    saveActiveSession(newSession);
    setActiveTab("SELL");
  };

  // UPDATE ACTIVE SESSION (Door logs, Undos)
  const handleUpdateSession = (updated: ActiveSession) => {
    setActiveSession(updated);
    saveActiveSession(updated);
  };

  // END SESSION
  const handleEndSession = async (note: string, experiment: string) => {
    if (!activeSession) return;

    const endedAtMs = Date.now();
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAtMs - activeSession.startedAt) / 1000)
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
      createdAt: new Date().toISOString(),
    };

    // Optimistically update sessions list
    setSessions((prev) => [record, ...prev]);

    // Clear active session immediately
    setActiveSession(null);
    saveActiveSession(null);

    // Persist to server or offline queue.
    // In offline-only mode the API echoes { offline: true } without persisting,
    // so keep the session in the durable offline queue as the source of truth.
    // In DB mode a successful save still goes through the queue-free path.
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error("Server rejected session save");
      }
      if (data?.offline) {
        addToOfflineQueue(record);
        setOfflinePendingCount((c) => c + 1);
      }
    } catch (err) {
      console.warn("Failed to reach server, saving to offline queue:", err);
      addToOfflineQueue(record);
      setOfflinePendingCount((c) => c + 1);
    }

    // Switch to history to admire route results
    setActiveTab("HISTORY");
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
    setSessions((prev) => prev.filter((s) => s.id !== id));
    // Always remove from the local queue too (source of truth offline).
    try {
      const remaining = getOfflineQueue().filter((s) => s.id !== id);
      clearOfflineQueue();
      for (const s of remaining) addToOfflineQueue(s);
      setOfflinePendingCount(remaining.length);
    } catch {
      // ignore local cleanup errors
    }
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete session on server:", err);
    }
  };

  // CLEAR DATA
  const handleClearData = async () => {
    try {
      for (const s of sessions) {
        await fetch(`/api/sessions/${s.id}`, { method: "DELETE" });
      }
      clearOfflineQueue();
      setOfflinePendingCount(0);
      setSessions([]);
    } catch (err) {
      console.error("Failed to clear data:", err);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <span className="text-sm font-black tracking-widest uppercase">
            DOORTRACK
          </span>
        </div>
      </div>
    );
  }

  const isSelling = activeSession !== null;
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        isSelling={isSelling}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setActiveTab("SETTINGS")}
        experiment={activeSession?.experiment}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
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
            />
          )
        ) : activeTab === "HISTORY" ? (
          <HistoryView
            sessions={sessions}
            onDeleteSession={handleDeleteSession}
            onStartRouteClick={() => setActiveTab("SELL")}
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
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isSelling={isSelling}
      />
    </div>
  );
}
