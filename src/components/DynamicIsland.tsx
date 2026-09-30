"use client";

import React, { useState, useEffect } from "react";
import { formatTimer } from "@/lib/formatters";
import { DoorClosed, Zap, Pause } from "lucide-react";

interface DynamicIslandProps {
  isSelling: boolean;
  isPaused?: boolean;
  startedAt: number;
  totalPausedMs?: number;
  doors: number;
  earnings: number;
  currency: string;
  onExpand?: () => void;
  targetDoors?: number;
}

export function DynamicIsland({
  isSelling,
  isPaused,
  startedAt,
  totalPausedMs = 0,
  doors,
  earnings,
  currency,
  onExpand,
  targetDoors,
}: DynamicIslandProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isSelling) return;
    const update = () => setNow(Date.now());
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isSelling]);

  if (!isSelling) return null;

  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt - totalPausedMs) / 1000));
  const progressPercent = targetDoors && targetDoors > 0 ? Math.min(100, Math.round((doors / targetDoors) * 100)) : null;

  return (
    <div
      onClick={onExpand}
      role="button"
      tabIndex={0}
      aria-label="Active route live status"
      className="tap-spring mx-auto mb-2 flex items-center justify-between px-4 py-2 rounded-full bg-[#0A0A0C] text-white shadow-[0_8px_25px_rgba(0,0,0,0.18)] border border-white/15 cursor-pointer max-w-[340px] w-full select-none"
    >
      {/* Left: Status & Timer */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {isPaused ? (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </>
          )}
        </span>

        {isPaused ? (
          <span className="text-[11px] font-bold tracking-wide uppercase text-amber-300 flex items-center gap-1">
            <Pause className="w-2.5 h-2.5" /> Paused
          </span>
        ) : (
          <span className="text-[13px] font-bold font-mono tracking-tight tabular-nums text-white">
            {formatTimer(elapsedSeconds)}
          </span>
        )}
      </div>

      {/* Middle: Progress or Quick Door count */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-[12px] font-semibold text-neutral-300">
          <DoorClosed className="w-3.5 h-3.5 stroke-[2.2]" />
          <span className="tabular-nums font-mono font-bold text-white">{doors}</span>
          {targetDoors ? (
            <span className="text-[10px] text-neutral-400 font-mono">/{targetDoors}</span>
          ) : null}
        </div>

        {progressPercent !== null && (
          <div className="w-10 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Right: Live Earnings */}
      <div className="flex items-center gap-1 text-[13px] font-extrabold tabular-nums font-mono text-white">
        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span>{earnings}</span>
        <span className="text-[10px] font-medium text-neutral-400 uppercase font-sans">{currency}</span>
      </div>
    </div>
  );
}
