"use client";

import React, { useState } from "react";
import { SessionRecord } from "@/types";
import {
  formatDateCaps,
  formatTimeShort,
  formatDurationHuman,
  formatHourlyRate,
  calculateHourlyRateNumber,
  calculateDoorsPerHour,
} from "@/lib/formatters";
import {
  ChevronLeft,
  Trash2,
  Share2,
  Check,
  MapPin,
  Sparkles,
  FileText,
  DoorClosed,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { playTap, playUndo } from "@/lib/audio";

interface SessionDetailModalProps {
  session: SessionRecord;
  allSessions: SessionRecord[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateSessionMeta?: (id: string, note: string, experiment: string, territory?: string) => void;
}

export function SessionDetailModal({
  session,
  allSessions,
  onClose,
  onDelete,
  onUpdateSessionMeta,
}: SessionDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTerritory, setEditTerritory] = useState(session.territory || "");
  const [editExperiment, setEditExperiment] = useState(session.experiment || "");
  const [editNote, setEditNote] = useState(session.note || "");

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
  const doorsPerHour = calculateDoorsPerHour(session.doors, session.durationSeconds);
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

  const handleCopySummary = () => {
    const text = `🚪 DoorTrack Route Summary\n📅 ${formatDateCaps(session.startedAt)} (${formatDurationHuman(session.durationSeconds)})\n💰 ${session.earnings} ${session.currency} (${formatHourlyRate(session.earnings, session.durationSeconds, session.currency)})\n🚪 ${session.doors} Doors | ${session.yesCount} Sales (${session.itemsSold} items)\n📊 ${yesRate}% Yes Rate | ${doorsPerHour} doors/h${session.experiment ? `\n🎯 Focus: ${session.experiment}` : ""}${session.territory ? `\n📍 Area: ${session.territory}` : ""}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (onUpdateSessionMeta) {
      onUpdateSessionMeta(session.id, editNote, editExperiment, editTerritory);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 p-2 sm:p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-[#18181B] rounded-[28px] p-5 pb-safe animate-sheet-up border border-black/5 dark:border-white/10 shadow-2xl">
        <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-3" />

        {/* Top bar */}
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="tap-spring text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white p-1 -ml-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
            aria-label="Back to history"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            <span>History</span>
          </button>

          <span className="text-[11px] font-semibold font-mono text-neutral-400 tabular-nums">
            {formatDateCaps(session.startedAt)} • {formatTimeShort(session.startedAt)}–{formatTimeShort(session.endedAt)}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopySummary}
              className="tap-spring p-1.5 text-neutral-400 hover:text-black dark:hover:text-white rounded-full cursor-pointer"
              title="Share summary"
              aria-label="Share route summary"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="tap-spring p-1.5 text-neutral-300 hover:text-red-500 rounded-full cursor-pointer"
              aria-label="Delete session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Earnings Block */}
        <div className="text-center pt-4 pb-3">
          <p className="text-[40px] leading-none font-black tabular-nums tracking-tight text-neutral-950 dark:text-white font-mono">
            {session.earnings}{" "}
            <span className="text-xl font-bold text-neutral-400 dark:text-neutral-500 font-sans">
              {session.currency}
            </span>
          </p>
          <p className="mt-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
            {formatDurationHuman(session.durationSeconds)} •{" "}
            {formatHourlyRate(session.earnings, session.durationSeconds, session.currency)}
          </p>
        </div>

        {/* Door Results Grid */}
        <div className="grid grid-cols-4 gap-2 my-3">
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-2.5 text-center border border-black/[0.04] dark:border-white/[0.05]">
            <p className="text-[18px] font-bold tabular-nums text-neutral-950 dark:text-white leading-tight">
              {session.doors}
            </p>
            <p className="text-[10px] font-medium text-neutral-400 uppercase mt-0.5">Doors</p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-2.5 text-center border border-black/[0.04] dark:border-white/[0.05]">
            <p className="text-[18px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight">
              {session.yesCount}
            </p>
            <p className="text-[10px] font-medium text-neutral-400 uppercase mt-0.5">Yes</p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-2.5 text-center border border-black/[0.04] dark:border-white/[0.05]">
            <p className="text-[18px] font-bold tabular-nums text-neutral-900 dark:text-neutral-200 leading-tight">
              {session.noCount}
            </p>
            <p className="text-[10px] font-medium text-neutral-400 uppercase mt-0.5">No</p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-2.5 text-center border border-black/[0.04] dark:border-white/[0.05]">
            <p className="text-[18px] font-bold tabular-nums text-neutral-400 leading-tight">
              {session.notHomeCount}
            </p>
            <p className="text-[10px] font-medium text-neutral-400 uppercase mt-0.5 truncate">No Ans.</p>
          </div>
        </div>

        {/* Conversion Breakdown Card */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-3.5 border border-black/[0.04] dark:border-white/[0.05] space-y-2 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Conversion Metrics
          </p>
          {[
            { l: "Yes Rate (Knock-to-Close)", v: `${yesRate}%` },
            { l: "Contact Rate (Answered Door)", v: `${contactRate}%` },
            { l: "Close Rate on Contacts", v: `${closeRate}%` },
            { l: "Knock Speed", v: `${doorsPerHour} doors/h` },
            { l: "Items per Sale", v: `${itemsPerYes}` },
          ].map((row) => (
            <div key={row.l} className="flex justify-between text-xs py-0.5">
              <span className="text-neutral-500 dark:text-neutral-400">{row.l}</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {row.v}
              </span>
            </div>
          ))}
        </div>

        {/* Compared with Rep's Average */}
        {otherSessions.length > 0 && (
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-3.5 border border-black/[0.04] dark:border-white/[0.05] space-y-2 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Performance vs All-Time Avg
            </p>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-neutral-500 dark:text-neutral-400">Hourly Earnings</span>
              <span
                className={`font-bold font-mono tabular-nums ${
                  avgRateDiff && avgRateDiff > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : avgRateDiff && avgRateDiff < 0
                    ? "text-rose-500"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {formatDiff(avgRateDiff, "%")}
              </span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-neutral-500 dark:text-neutral-400">Doors per Hour</span>
              <span
                className={`font-bold font-mono tabular-nums ${
                  avgDoorsPerHourDiff && avgDoorsPerHourDiff > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : avgDoorsPerHourDiff && avgDoorsPerHourDiff < 0
                    ? "text-rose-500"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {formatDiff(avgDoorsPerHourDiff, "%")}
              </span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-neutral-500 dark:text-neutral-400">Yes Rate Difference</span>
              <span
                className={`font-bold font-mono tabular-nums ${
                  avgYesRateDiff && avgYesRateDiff > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : avgYesRateDiff && avgYesRateDiff < 0
                    ? "text-rose-500"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {formatDiff(avgYesRateDiff, "%")}
              </span>
            </div>
          </div>
        )}

        {/* Territory, Focus & Notes (View / Edit mode) */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-3.5 border border-black/[0.04] dark:border-white/[0.05] mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Route Details
            </span>
            {onUpdateSessionMeta && (
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="text-xs font-semibold text-neutral-900 dark:text-white"
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Territory / Area"
                value={editTerritory}
                onChange={(e) => setEditTerritory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Pitch Focus / Experiment"
                value={editExperiment}
                onChange={(e) => setEditExperiment(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
              <textarea
                rows={2}
                placeholder="Session Notes"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none resize-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              {session.territory && (
                <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{session.territory}</span>
                </div>
              )}
              {session.experiment && (
                <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{session.experiment}</span>
                </div>
              )}
              {session.note ? (
                <div className="flex items-start gap-1.5 text-neutral-600 dark:text-neutral-400 pt-1">
                  <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>{session.note}</span>
                </div>
              ) : !session.territory && !session.experiment ? (
                <p className="text-neutral-400 italic">No notes or territory recorded.</p>
              ) : null}
            </div>
          )}
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="tap-spring w-full h-13 bg-black text-white dark:bg-white dark:text-black rounded-2xl font-bold text-[16px] cursor-pointer"
        >
          Done
        </button>

        {/* Delete Confirmation Sheet */}
        {confirmDelete && (
          <div className="fixed inset-0 z-60 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#18181B] rounded-3xl p-5 max-w-xs w-full text-center border border-black/5 dark:border-white/10 shadow-2xl">
              <p className="text-[16px] font-bold text-neutral-950 dark:text-white">
                Delete Route Record?
              </p>
              <p className="text-xs text-neutral-400 mt-1 mb-4">
                This will remove the session permanently from your history and charts.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    playUndo();
                    onDelete(session.id);
                    onClose();
                  }}
                  className="tap-spring w-full h-11 bg-red-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="tap-spring w-full h-11 text-neutral-500 dark:text-neutral-400 text-xs font-semibold cursor-pointer"
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
