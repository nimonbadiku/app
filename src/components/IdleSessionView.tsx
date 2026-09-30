"use client";

import React, { useState } from "react";
import { SessionRecord, UserSettingsConfig } from "@/types";
import { formatDateCaps, formatDurationHuman, formatHourlyRate } from "@/lib/formatters";
import {
  Play,
  Target,
  Sparkles,
  MapPin,
  Flame,
  ChevronRight,
  TrendingUp,
  Award,
  CheckCircle2,
} from "lucide-react";
import { playTap, triggerHaptic } from "@/lib/audio";

interface IdleSessionViewProps {
  onStartSession: (experiment: string, territory?: string, targetDoors?: number) => void;
  lastSession: SessionRecord | null;
  totalSessionsCount: number;
  settings: UserSettingsConfig;
  onViewHistory: () => void;
  allSessions?: SessionRecord[];
}

const PRO_TIPS = [
  "Confidence and a warm smile in the first 4 seconds make 80% of sales.",
  "Never assume they aren't interested. Deliver your clear value first.",
  "Keep your feet moving. Rhythm and pacing create high-energy closing momentum.",
  "Notice details on the porch (sports team, dog toys) for natural rapport.",
  "A swift 'No' is good data—it moves you faster to the next 'Yes'.",
];

export function IdleSessionView({
  onStartSession,
  lastSession,
  totalSessionsCount,
  settings,
  onViewHistory,
  allSessions = [],
}: IdleSessionViewProps) {
  const [experiment, setExperiment] = useState("");
  const [territory, setTerritory] = useState("");
  const [targetDoors, setTargetDoors] = useState<number>(settings.defaultTargetDoors || 40);
  const [customTarget, setCustomTarget] = useState<string>("");

  const soundOn = settings.soundEnabled ?? true;
  const hapticsOn = settings.hapticsEnabled ?? true;

  const presets = settings.focusPresets || [
    "Direct Hook",
    "Problem First",
    "Friendly Neighbor",
    "Shorter Pitch",
    "Weekend Special",
  ];

  // Today's summary
  const now = new Date();
  const todaySessions = allSessions.filter((s) => {
    const d = new Date(s.startedAt);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const todayEarnings = todaySessions.reduce((acc, s) => acc + s.earnings, 0);
  const todayDoors = todaySessions.reduce((acc, s) => acc + s.doors, 0);
  const todayYes = todaySessions.reduce((acc, s) => acc + s.yesCount, 0);

  // Pro tip index based on day of month
  const tipIndex = now.getDate() % PRO_TIPS.length;
  const dailyTip = PRO_TIPS[tipIndex];

  const handleStart = () => {
    playTap(soundOn);
    triggerHaptic("heavy", hapticsOn);
    const finalTarget = customTarget ? parseInt(customTarget) || targetDoors : targetDoors;
    onStartSession(experiment.trim(), territory.trim() || undefined, finalTarget > 0 ? finalTarget : undefined);
  };

  return (
    <div className="flex flex-col max-w-md mx-auto px-4 pt-2 pb-safe-nav select-none min-h-[calc(100dvh-130px)] justify-between">
      {/* TOP SECTION: Today's Snapshot & Setup */}
      <div className="space-y-3.5">
        {/* Status Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Ready to Knock
            </span>
          </div>
          <span className="text-[12px] font-semibold text-neutral-400 font-mono">
            {totalSessionsCount} {totalSessionsCount === 1 ? "route" : "routes"} logged
          </span>
        </div>

        {/* Today's Activity Card (if active today) */}
        {todaySessions.length > 0 && (
          <div className="ios-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" /> Today&apos;s Performance
              </span>
              <span className="text-[15px] font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{todayEarnings} {settings.currency}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
              <span>{todayDoors} doors knocked</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{todayYes} sales</span>
              <span>•</span>
              <span>{todaySessions.length} {todaySessions.length === 1 ? "route" : "routes"}</span>
            </div>
          </div>
        )}

        {/* ROUTE SETUP CARD */}
        <div className="ios-card p-4.5 space-y-4">
          {/* Target Door Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" /> Door Target
              </label>
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg">
                {customTarget ? `${customTarget} doors` : `${targetDoors} doors`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[25, 40, 60, 80, 100].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    playTap(soundOn);
                    setTargetDoors(count);
                    setCustomTarget("");
                  }}
                  className={`tap-spring h-10 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                    targetDoors === count && !customTarget
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                      : "bg-[#F4F5F7] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Territory / Area */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" /> Territory / Area (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Westside Park, Sector B"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800/80 border border-black/[0.04] dark:border-white/[0.06] text-[14px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black/20"
            />
          </div>

          {/* Pitch Focus Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" /> Pitch Focus / Strategy
              </label>
              {experiment && (
                <button
                  onClick={() => setExperiment("")}
                  className="text-[11px] font-semibold text-neutral-400 hover:text-black dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Strategy or opener to test..."
              value={experiment}
              onChange={(e) => setExperiment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800/80 border border-black/[0.04] dark:border-white/[0.06] text-[14px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black/20 mb-2.5"
            />

            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    playTap(soundOn);
                    setExperiment(experiment === preset ? "" : preset);
                  }}
                  className={`tap-spring text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    experiment === preset
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-2xs"
                      : "bg-[#F4F5F7] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-transparent hover:bg-neutral-200/70"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Last Session & Primary Start Button */}
      <div className="space-y-3 pt-4">
        {/* Last Route Preview Card */}
        {lastSession ? (
          <button
            onClick={() => {
              playTap(soundOn);
              onViewHistory();
            }}
            className="tap-spring w-full text-left ios-card p-3.5 cursor-pointer flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-black tabular-nums font-mono text-neutral-950 dark:text-white">
                  {lastSession.earnings} {lastSession.currency}
                </span>
                <span className="text-[11px] font-semibold text-neutral-400 font-mono">
                  {formatDateCaps(lastSession.startedAt)} • {formatDurationHuman(lastSession.durationSeconds)}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums font-medium">
                {lastSession.doors} doors • {lastSession.yesCount} yes •{" "}
                {formatHourlyRate(lastSession.earnings, lastSession.durationSeconds, lastSession.currency)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-[#F6F7F9] dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.05] text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              💡 {dailyTip}
            </p>
          </div>
        )}

        {/* PRIMARY HERO START BUTTON */}
        <div>
          <button
            onClick={handleStart}
            className="tap-spring w-full h-[68px] bg-black text-white dark:bg-white dark:text-black rounded-3xl text-[19px] font-extrabold tracking-wide flex items-center justify-center gap-2.5 shadow-[0_8px_25px_rgba(0,0,0,0.14)] border border-white/20 dark:border-black/20 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Route</span>
          </button>
          <p className="text-center text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mt-2">
            Timestamp-safe timer • Works 100% offline & on locked screen
          </p>
        </div>
      </div>
    </div>
  );
}
