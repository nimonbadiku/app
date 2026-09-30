"use client";

import React, { useState } from "react";
import { SessionRecord } from "@/types";
import {
  formatDateCaps,
  formatTimeShort,
  formatDurationHuman,
  formatHourlyRate,
  calculateHourlyRateNumber,
} from "@/lib/formatters";
import { ChevronLeft, Trash2 } from "lucide-react";

interface SessionDetailModalProps {
  session: SessionRecord;
  allSessions: SessionRecord[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function SessionDetailModal({
  session,
  allSessions,
  onClose,
  onDelete,
}: SessionDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Conversion rates
  const yesRate =
    session.doors > 0 ? ((session.yesCount / session.doors) * 100).toFixed(1) : "0";
  const contactRate =
    session.doors > 0
      ? (((session.yesCount + session.noCount) / session.doors) * 100).toFixed(1)
      : "0";
  const contacts = session.yesCount + session.noCount;
  const closeRate =
    contacts > 0 ? ((session.yesCount / contacts) * 100).toFixed(1) : "0";
  const itemsPerYes =
    session.yesCount > 0 ? (session.itemsSold / session.yesCount).toFixed(1) : "0";

  const hours = session.durationSeconds > 0 ? session.durationSeconds / 3600 : 0;
  const doorsPerHour = hours > 0 ? Math.round(session.doors / hours) : 0;
  const sessionRate = calculateHourlyRateNumber(
    session.earnings,
    session.durationSeconds
  );

  // Compare with average
  const otherSessions = allSessions.filter((s) => s.id !== session.id);
  let avgRateDiff: number | null = null;
  let avgDoorsPerHourDiff: number | null = null;
  let avgYesRateDiff: number | null = null;

  if (otherSessions.length > 0) {
    const totalOtherHours = otherSessions.reduce(
      (acc, s) => acc + (s.durationSeconds > 0 ? s.durationSeconds / 3600 : 0),
      0
    );
    const totalOtherEarnings = otherSessions.reduce((acc, s) => acc + s.earnings, 0);
    const totalOtherDoors = otherSessions.reduce((acc, s) => acc + s.doors, 0);
    const totalOtherYes = otherSessions.reduce((acc, s) => acc + s.yesCount, 0);

    const avgRate =
      totalOtherHours > 0 ? totalOtherEarnings / totalOtherHours : 0;
    const avgDph = totalOtherHours > 0 ? totalOtherDoors / totalOtherHours : 0;
    const avgYr = totalOtherDoors > 0 ? (totalOtherYes / totalOtherDoors) * 100 : 0;

    if (avgRate > 0) {
      avgRateDiff = Math.round(((sessionRate - avgRate) / avgRate) * 100);
    }
    if (avgDph > 0) {
      avgDoorsPerHourDiff = Math.round(((doorsPerHour - avgDph) / avgDph) * 100);
    }
    if (avgYr > 0) {
      const currentYrNum = session.doors > 0 ? (session.yesCount / session.doors) * 100 : 0;
      avgYesRateDiff = parseFloat((currentYrNum - avgYr).toFixed(1));
    }
  }

  const formatDiff = (val: number | null, unit: string = "%") => {
    if (val === null) return "—";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val}${unit}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-[24px] p-5 pb-safe">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-neutral-400 p-2 -ml-2 cursor-pointer"
            aria-label="Close"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
            {formatDateCaps(session.startedAt)} · {formatTimeShort(session.startedAt)}–{formatTimeShort(session.endedAt)}
          </span>

          <button
            onClick={() => setConfirmDelete(true)}
            className="text-neutral-300 p-2 -mr-2 cursor-pointer"
            aria-label="Delete session"
          >
            <Trash2 className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* Hero */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[36px] leading-none font-bold tabular-nums tracking-tight text-neutral-950">
            {session.earnings} <span className="text-xl font-semibold text-neutral-400">{session.currency}</span>
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-neutral-400 tabular-nums">
            {formatDurationHuman(session.durationSeconds)} ·{" "}
            {formatHourlyRate(session.earnings, session.durationSeconds, session.currency)}
          </p>
        </div>

        {/* Doors breakdown */}
        <div className="flex items-center justify-center divide-x divide-neutral-200/80 py-3">
          {[
            { v: session.doors, l: "Doors" },
            { v: session.yesCount, l: "Yes" },
            { v: session.noCount, l: "No" },
            { v: session.notHomeCount, l: "No ans." },
          ].map((s) => (
            <div key={s.l} className="px-4 text-center">
              <p className="text-[19px] font-bold tabular-nums text-neutral-900 leading-none">{s.v}</p>
              <p className="text-[10px] font-medium text-neutral-400 mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Conversion metrics — plain rows */}
        <div className="mt-4 bg-neutral-50 rounded-2xl p-4 space-y-2">
          {[
            { l: "Yes rate", v: `${yesRate}%` },
            { l: "Contact rate", v: `${contactRate}%` },
            { l: "Close rate", v: `${closeRate}%` },
            { l: "Doors / hour", v: `${doorsPerHour}` },
            { l: "Items per yes", v: `${itemsPerYes}` },
          ].map((row) => (
            <div key={row.l} className="flex justify-between text-[13px]">
              <span className="text-neutral-400">{row.l}</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{row.v}</span>
            </div>
          ))}
        </div>

        {/* Compared with average */}
        {otherSessions.length > 0 && (
          <div className="mt-3 bg-neutral-50 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              vs your average
            </p>
            <div className="flex justify-between text-[13px]">
              <span className="text-neutral-400">{session.currency} / hour</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatDiff(avgRateDiff, "%")}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-neutral-400">Doors / hour</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatDiff(avgDoorsPerHourDiff, "%")}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-neutral-400">Yes rate</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatDiff(avgYesRateDiff, "%")}
              </span>
            </div>
          </div>
        )}

        {/* Note / experiment */}
        {(session.note || session.experiment) && (
          <div className="mt-3 px-1 space-y-1">
            {session.experiment && (
              <p className="text-[13px] text-neutral-500">
                Focus: <span className="text-neutral-900 font-medium">{session.experiment}</span>
              </p>
            )}
            {session.note && (
              <p className="text-[13px] text-neutral-500">{session.note}</p>
            )}
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="mt-4 w-full h-[54px] bg-black text-white rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-transform cursor-pointer"
        >
          Done
        </button>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center">
              <p className="text-[15px] font-bold text-neutral-900">Delete this session?</p>
              <p className="text-[13px] text-neutral-400 mt-1 mb-4">
                This can&apos;t be undone.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onDelete(session.id);
                    onClose();
                  }}
                  className="w-full h-11 bg-black text-white text-[15px] font-semibold rounded-xl active:scale-[0.98] transition-transform cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-full h-11 text-neutral-500 text-[15px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
