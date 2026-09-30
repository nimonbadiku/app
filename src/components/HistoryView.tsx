"use client";

import React, { useState } from "react";
import { SessionRecord } from "@/types";
import { formatDateCaps, formatDurationHuman, formatHourlyRate } from "@/lib/formatters";
import { SessionDetailModal } from "./SessionDetailModal";

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
    <div className="max-w-md mx-auto px-5 pt-3 pb-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        History
      </p>

      {sessions.length === 0 ? (
        <div className="mt-3 text-center py-14 px-4 bg-white rounded-2xl border border-neutral-200/80">
          <p className="text-[15px] font-semibold text-neutral-900">No sessions yet</p>
          <p className="text-[13px] text-neutral-400 mt-1">
            Finish a route and it will show up here.
          </p>
          <button
            onClick={onStartRouteClick}
            className="mt-5 px-5 h-11 bg-black text-white text-[15px] font-bold rounded-2xl active:scale-[0.98] transition-transform cursor-pointer"
          >
            Start session
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="w-full text-left bg-white rounded-2xl border border-neutral-200/80 px-4 py-3 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold tabular-nums text-neutral-950 tracking-tight">
                  {session.earnings} {session.currency}
                </span>
                <span className="text-[11px] font-medium text-neutral-400 shrink-0 tabular-nums">
                  {formatDateCaps(session.startedAt)}
                </span>
              </div>

              <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                {session.doors} doors · {session.yesCount} yes · {session.itemsSold} items ·{" "}
                {formatDurationHuman(session.durationSeconds)} ·{" "}
                {formatHourlyRate(session.earnings, session.durationSeconds, session.currency)}
              </p>

              {(session.note || session.experiment) && (
                <p className="mt-1.5 text-[13px] text-neutral-400 truncate">
                  {session.experiment || session.note}
                </p>
              )}
            </button>
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
