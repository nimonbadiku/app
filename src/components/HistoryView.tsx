"use client";

import React, { useState, useMemo } from "react";
import { SessionRecord, UserSettingsConfig } from "@/types";
import {
  formatDateCaps,
  formatDateNice,
  formatDurationHuman,
  formatHourlyRate,
} from "@/lib/formatters";
import { SessionDetailModal } from "./SessionDetailModal";
import { ManualSessionModal } from "./ManualSessionModal";
import {
  Search,
  Plus,
  Calendar,
  Sparkles,
  MapPin,
  ChevronRight,
  Flame,
  Filter,
} from "lucide-react";
import { playTap } from "@/lib/audio";

interface HistoryViewProps {
  sessions: SessionRecord[];
  settings: UserSettingsConfig;
  onDeleteSession: (id: string) => void;
  onStartRouteClick: () => void;
  onAddManualSession: (session: SessionRecord) => void;
  onUpdateSessionMeta?: (id: string, note: string, experiment: string, territory?: string) => void;
  onGenerateDemoData?: () => void;
}

export function HistoryView({
  sessions,
  settings,
  onDeleteSession,
  onStartRouteClick,
  onAddManualSession,
  onUpdateSessionMeta,
  onGenerateDemoData,
}: HistoryViewProps) {
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "WEEK" | "MONTH">("ALL");

  const soundOn = settings.soundEnabled ?? true;

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    let list = [...sessions];

    // Time filter
    const now = new Date();
    if (timeFilter === "WEEK") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((s) => new Date(s.startedAt) >= oneWeekAgo);
    } else if (timeFilter === "MONTH") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter((s) => new Date(s.startedAt) >= oneMonthAgo);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.experiment && s.experiment.toLowerCase().includes(q)) ||
          (s.territory && s.territory.toLowerCase().includes(q)) ||
          (s.note && s.note.toLowerCase().includes(q)) ||
          formatDateNice(s.startedAt).toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [sessions, timeFilter, searchQuery]);

  // Aggregate stats across all sessions
  const totalEarned = sessions.reduce((acc, s) => acc + s.earnings, 0);
  const totalDoors = sessions.reduce((acc, s) => acc + s.doors, 0);
  const totalYes = sessions.reduce((acc, s) => acc + s.yesCount, 0);
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = totalSeconds / 3600;
  const avgRate = totalHours > 0 ? Math.round(totalEarned / totalHours) : 0;
  const overallYesRate = totalDoors > 0 ? ((totalYes / totalDoors) * 100).toFixed(0) : "0";

  // Group by date string
  const groupedSessions = useMemo(() => {
    const groups: { dateKey: string; items: SessionRecord[] }[] = [];
    filteredSessions.forEach((session) => {
      const dateKey = formatDateNice(session.startedAt);
      const existing = groups.find((g) => g.dateKey === dateKey);
      if (existing) {
        existing.items.push(session);
      } else {
        groups.push({ dateKey, items: [session] });
      }
    });
    return groups;
  }, [filteredSessions]);

  return (
    <div className="max-w-md mx-auto px-4 pt-2 pb-safe-nav select-none space-y-3.5">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold text-neutral-950 dark:text-white tracking-tight">
          Route History
        </h2>
        <button
          onClick={() => {
            playTap(soundOn);
            setManualModalOpen(true);
          }}
          className="tap-spring flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Route</span>
        </button>
      </div>

      {/* Aggregate KPI Summary Card */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                All-Time Performance
              </p>
              <p className="text-[28px] font-black tabular-nums tracking-tight text-neutral-950 dark:text-white font-mono mt-0.5">
                {totalEarned}{" "}
                <span className="text-base font-bold text-neutral-400 font-sans">
                  {settings.currency}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {avgRate} {settings.currency}/h avg
              </span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {overallYesRate}% Yes Rate
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-center">
            <div>
              <span className="text-sm font-bold tabular-nums font-mono text-neutral-900 dark:text-white">
                {sessions.length}
              </span>
              <span className="block text-[10px] font-medium text-neutral-400 uppercase">
                Routes
              </span>
            </div>
            <div>
              <span className="text-sm font-bold tabular-nums font-mono text-neutral-900 dark:text-white">
                {totalDoors}
              </span>
              <span className="block text-[10px] font-medium text-neutral-400 uppercase">
                Doors
              </span>
            </div>
            <div>
              <span className="text-sm font-bold tabular-nums font-mono text-neutral-900 dark:text-white">
                {formatDurationHuman(totalSeconds)}
              </span>
              <span className="block text-[10px] font-medium text-neutral-400 uppercase">
                Time
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      {sessions.length > 0 && (
        <div className="space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search territory, pitch focus, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-[#121214] border border-black/[0.06] dark:border-white/[0.08] text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Time Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-white dark:bg-[#121214] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
            {(
              [
                { id: "ALL", label: "All Time" },
                { id: "WEEK", label: "Past 7 Days" },
                { id: "MONTH", label: "This Month" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playTap(soundOn);
                  setTimeFilter(tab.id);
                }}
                className={`tap-spring flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  timeFilter === tab.id
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SESSIONS LIST */}
      {sessions.length === 0 ? (
        <div className="mt-6 text-center py-12 px-5 bg-white dark:bg-[#121214] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <Calendar className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-[16px] font-bold text-neutral-950 dark:text-white">
            No Routes Logged Yet
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-[240px] mx-auto">
            Knock doors with the live tracker, or backfill past route data manually.
          </p>

          <div className="mt-5 space-y-2 max-w-xs mx-auto">
            <button
              onClick={onStartRouteClick}
              className="tap-spring w-full h-12 bg-black text-white dark:bg-white dark:text-black text-sm font-bold rounded-2xl shadow-sm cursor-pointer"
            >
              Start New Route
            </button>
            {onGenerateDemoData && (
              <button
                onClick={onGenerateDemoData}
                className="tap-spring w-full h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-2xl cursor-pointer"
              >
                Load Sample Demo Routes
              </button>
            )}
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-[#121214] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            No routes matched &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setTimeFilter("ALL");
            }}
            className="mt-2 text-xs font-bold text-black dark:text-white underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedSessions.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                {group.dateKey}
              </p>

              <div className="space-y-2">
                {group.items.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      playTap(soundOn);
                      setSelectedSession(session);
                    }}
                    className="tap-spring w-full text-left bg-white dark:bg-[#121214] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-xs cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[18px] font-black tabular-nums font-mono text-neutral-950 dark:text-white">
                          {session.earnings}{" "}
                          <span className="text-xs font-bold text-neutral-400 font-sans">
                            {session.currency}
                          </span>
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-400 font-mono">
                          {formatDurationHuman(session.durationSeconds)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums font-medium">
                        <span>{session.doors} doors</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {session.yesCount} yes ({session.itemsSold} sold)
                        </span>
                        <span>•</span>
                        <span>
                          {formatHourlyRate(session.earnings, session.durationSeconds, session.currency)}
                        </span>
                      </div>

                      {(session.territory || session.experiment || session.note) && (
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                          {session.territory && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                              <MapPin className="w-2.5 h-2.5" />
                              {session.territory}
                            </span>
                          )}
                          {session.experiment && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 truncate">
                              <Sparkles className="w-2.5 h-2.5 shrink-0" />
                              {session.experiment}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          allSessions={sessions}
          onClose={() => setSelectedSession(null)}
          onDelete={onDeleteSession}
          onUpdateSessionMeta={onUpdateSessionMeta}
        />
      )}

      {/* MANUAL SESSION ENTRY MODAL */}
      {manualModalOpen && (
        <ManualSessionModal
          settings={settings}
          onSave={onAddManualSession}
          onClose={() => setManualModalOpen(false)}
        />
      )}
    </div>
  );
}
