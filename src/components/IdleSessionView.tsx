"use client";

import React, { useState } from "react";
import { SessionRecord, UserSettingsConfig } from "@/types";
import { formatDateCaps, formatDurationHuman, formatHourlyRate } from "@/lib/formatters";

interface IdleSessionViewProps {
  onStartSession: (experiment: string) => void;
  lastSession: SessionRecord | null;
  totalSessionsCount: number;
  settings: UserSettingsConfig;
  onViewHistory: () => void;
}

export function IdleSessionView({
  onStartSession,
  lastSession,
  totalSessionsCount,
  onViewHistory,
}: IdleSessionViewProps) {
  const [experiment, setExperiment] = useState("");
  const [showFocus, setShowFocus] = useState(false);

  const presets = ["New opener", "2 tickets", "Shorter pitch", "Energy up"];

  return (
    <div className="flex flex-col max-w-md mx-auto px-5 pt-3 pb-28 min-h-[calc(100dvh-120px)]">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {totalSessionsCount > 0 ? `${totalSessionsCount} sessions logged` : "Ready to sell"}
      </p>

      {/* Experiment / Focus selection — collapsed so START needs no scroll */}
      <div className="mt-3">
        {!showFocus && !experiment ? (
          <button
            onClick={() => setShowFocus(true)}
            className="w-full text-center text-xs font-medium text-neutral-400 py-1.5 cursor-pointer"
          >
            + Add route focus <span className="text-neutral-300">(optional)</span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-3.5">
            <input
              type="text"
              placeholder="Focus for this route…"
              value={experiment}
              onChange={(e) => setExperiment(e.target.value)}
              onBlur={() => {
                if (!experiment) setShowFocus(false);
              }}
              enterKeyHint="done"
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-transparent text-[15px] focus:outline-none focus:border-neutral-300 placeholder:text-neutral-300"
            />

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setExperiment(experiment === preset ? "" : preset)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    experiment === preset
                      ? "bg-black text-white border-black font-semibold"
                      : "bg-white text-neutral-500 border-neutral-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-4" />

      {lastSession ? (
        <button
          onClick={onViewHistory}
          className="w-full text-left bg-white rounded-2xl border border-neutral-200/80 px-4 py-3 active:scale-[0.99] transition-transform cursor-pointer"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-bold tabular-nums text-neutral-950 tracking-tight">
              {lastSession.earnings} {lastSession.currency}
            </span>
            <span className="text-[11px] font-medium text-neutral-400 shrink-0">
              {formatDateCaps(lastSession.startedAt)} · {formatDurationHuman(lastSession.durationSeconds)}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
            {lastSession.doors} doors · {lastSession.yesCount} yes ·{" "}
            {formatHourlyRate(lastSession.earnings, lastSession.durationSeconds, lastSession.currency)}
          </p>
        </button>
      ) : (
        <p className="text-center text-[13px] text-neutral-300">
          Your last route will show here.
        </p>
      )}

      <div className="mt-3">
        <button
          onClick={() => onStartSession(experiment.trim())}
          className="w-full h-[60px] bg-black text-white rounded-2xl text-[17px] font-bold tracking-wide active:scale-[0.98] transition-transform cursor-pointer"
        >
          Start session
        </button>
        <p className="text-center text-[11px] text-neutral-300 mt-2">
          Timer starts immediately
        </p>
      </div>
    </div>
  );
}
