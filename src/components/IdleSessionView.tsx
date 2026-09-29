"use client";

import React, { useState } from "react";
import { Play, Sparkles, CheckCircle2, History, TrendingUp, Flame } from "lucide-react";
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
  settings,
  onViewHistory,
}: IdleSessionViewProps) {
  const [experiment, setExperiment] = useState("");
  const [isSettingFocus, setIsSettingFocus] = useState(false);

  const experimentPresets = [
    "New opener",
    "Asked for 2 tickets",
    "Shorter pitch",
    "More energetic",
    "Direct value pitch",
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] max-w-md mx-auto px-6 pt-6 pb-24 justify-between">
      {/* Top Header info */}
      <div>
        <div className="text-center pt-4 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-4">
            <Flame className="w-3.5 h-3.5 text-neutral-900" />
            <span>Ready for the route</span>
          </div>

          <h2 className="text-4xl font-black tracking-tight text-neutral-950 font-sans">
            DoorTrack
          </h2>
          <p className="text-xs text-neutral-500 font-medium tracking-wide mt-1.5">
            Tap result. Keep walking. Pure focus.
          </p>
        </div>

        {/* Experiment / Focus selection */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neutral-800" />
              Route Focus / Experiment
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">Optional</span>
          </div>

          <input
            type="text"
            placeholder="e.g. Testing new opener, more smiles..."
            value={experiment}
            onChange={(e) => setExperiment(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-black font-handwriting text-base bg-neutral-50/50"
          />

          {/* Quick experiment pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {experimentPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setExperiment(preset)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  experiment === preset
                    ? "bg-black text-white border-black font-medium"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Last session recap card */}
        {lastSession && (
          <div
            onClick={onViewHistory}
            className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs hover:border-neutral-400 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              <span>Last Session Recap</span>
              <span>{formatDateCaps(lastSession.startedAt)}</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-neutral-950">
                  {lastSession.earnings} {lastSession.currency}
                </span>
                <span className="text-xs text-neutral-500 font-medium ml-2">
                  {formatDurationHuman(lastSession.durationSeconds)}
                </span>
              </div>
              <span className="text-xs font-bold text-neutral-700">
                {formatHourlyRate(
                  lastSession.earnings,
                  lastSession.durationSeconds,
                  lastSession.currency
                )}
              </span>
            </div>

            <div className="text-xs text-neutral-600 mt-2 flex items-center gap-3">
              <span>
                <strong>{lastSession.doors}</strong> doors
              </span>
              <span>•</span>
              <span>
                <strong>{lastSession.yesCount}</strong> yes
              </span>
              <span>•</span>
              <span>
                <strong>{lastSession.itemsSold}</strong> items
              </span>
            </div>

            {lastSession.note && (
              <p className="mt-2 text-xs text-neutral-500 font-handwriting italic truncate border-t border-neutral-100 pt-2">
                &ldquo;{lastSession.note}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* BIG PRIMARY START BUTTON */}
      <div className="pt-6">
        <button
          onClick={() => onStartSession(experiment)}
          className="w-full h-16 bg-black text-white rounded-[22px] flex items-center justify-center gap-3 text-lg font-black tracking-wider uppercase hover:bg-neutral-900 active:scale-[0.98] transition-all cursor-pointer shadow-md"
        >
          <Play className="w-5 h-5 fill-white stroke-none" />
          <span>START SESSION</span>
        </button>

        <p className="text-center text-[11px] font-medium text-neutral-400 uppercase tracking-wider mt-3">
          Timer starts immediately · iPhone safe
        </p>
      </div>
    </div>
  );
}
