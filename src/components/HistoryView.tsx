"use client";

import React, { useState } from "react";
import { SessionRecord } from "@/types";
import { formatDateCaps, formatDurationHuman, formatHourlyRate } from "@/lib/formatters";
import { SessionDetailModal } from "./SessionDetailModal";
import { ChevronRight, Calendar, Sparkles } from "lucide-react";

interface HistoryViewProps {
  sessions: SessionRecord[];
  onDeleteSession: (id: string) => void;
  onStartRouteClick: () => void;
}

export function HistoryView({
  sessions,
  onDeleteSession,
  onStartRouteClick,
}: HistoryViewProps) {
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950">
            Route History
          </h2>
          <p className="text-xs text-neutral-500 font-medium">
            {sessions.length} session{sessions.length === 1 ? "" : "s"} logged
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-neutral-200/80">
          <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900">No sessions recorded yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            When you complete a selling route, your door counts and earnings will appear here.
          </p>
          <button
            onClick={onStartRouteClick}
            className="mt-5 px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer"
          >
            Start First Session
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs hover:border-black active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Header: Date and Duration */}
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-900 mb-2">
                <span>{formatDateCaps(session.startedAt)}</span>
                <span className="font-mono text-neutral-500 font-semibold lowercase">
                  {formatDurationHuman(session.durationSeconds)}
                </span>
              </div>

              {/* Stats line: 47 doors · 14 yes · 21 items */}
              <div className="text-xs font-semibold text-neutral-600 mb-3 flex items-center gap-1.5 flex-wrap">
                <span>{session.doors} doors</span>
                <span className="text-neutral-300">•</span>
                <span>{session.yesCount} yes</span>
                <span className="text-neutral-300">•</span>
                <span>{session.itemsSold} items</span>
              </div>

              {/* Earnings & Hourly Rate */}
              <div className="flex items-baseline justify-between border-t border-neutral-100 pt-3">
                <span className="text-2xl font-black text-neutral-950 font-sans">
                  {session.earnings}{" "}
                  <span className="text-base font-bold text-neutral-700">
                    {session.currency}
                  </span>
                </span>
                <span className="text-xs font-bold text-neutral-800">
                  {formatHourlyRate(
                    session.earnings,
                    session.durationSeconds,
                    session.currency
                  )}
                </span>
              </div>

              {/* Handwritten Note or Experiment quote */}
              {(session.note || session.experiment) && (
                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-neutral-600">
                  <Sparkles className="w-3 h-3 text-neutral-400 shrink-0" />
                  <p className="text-sm font-handwriting truncate text-neutral-800">
                    &ldquo;{session.note || session.experiment}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          allSessions={sessions}
          onClose={() => setSelectedSession(null)}
          onDelete={onDeleteSession}
        />
      )}
    </div>
  );
}
