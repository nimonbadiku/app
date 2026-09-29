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
import {
  ChevronLeft,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Home,
  Package,
  DoorClosed,
  TrendingUp,
} from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe border border-neutral-200 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black py-1 -ml-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </button>

          <span className="text-xs font-black uppercase tracking-widest text-neutral-900">
            {formatDateCaps(session.startedAt)}
          </span>

          <button
            onClick={() => setConfirmDelete(true)}
            className="text-neutral-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
            aria-label="Delete session"
          >
            <Trash2 className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* Hero numbers */}
        <div className="text-center py-6 border-b border-neutral-100">
          <h2 className="text-5xl font-black text-neutral-950 font-sans tracking-tight">
            {session.earnings}{" "}
            <span className="text-3xl font-extrabold text-neutral-800">
              {session.currency}
            </span>
          </h2>
          <p className="mt-2 text-sm font-semibold text-neutral-600 tracking-wide">
            {formatDurationHuman(session.durationSeconds)} •{" "}
            {formatHourlyRate(
              session.earnings,
              session.durationSeconds,
              session.currency
            )}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {formatTimeShort(session.startedAt)} – {formatTimeShort(session.endedAt)}
          </p>
        </div>

        {/* Live Doors breakdown */}
        <div className="grid grid-cols-4 gap-2 py-5 text-center border-b border-neutral-100">
          <div className="flex flex-col items-center">
            <DoorClosed className="w-4 h-4 text-neutral-600 mb-1" />
            <span className="text-lg font-black text-neutral-900">{session.doors}</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Doors</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-4 h-4 text-neutral-600 mb-1" />
            <span className="text-lg font-black text-neutral-900">{session.yesCount}</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Yes</span>
          </div>
          <div className="flex flex-col items-center">
            <XCircle className="w-4 h-4 text-neutral-600 mb-1" />
            <span className="text-lg font-black text-neutral-900">{session.noCount}</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">No</span>
          </div>
          <div className="flex flex-col items-center">
            <Home className="w-4 h-4 text-neutral-600 mb-1" />
            <span className="text-lg font-black text-neutral-900">{session.notHomeCount}</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Not Home</span>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="py-4 border-b border-neutral-100">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900 block mb-2.5">
            Conversion Rates
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-neutral-50 rounded-xl">
              <span className="text-neutral-500 block text-[10px] font-bold uppercase">
                Yes Rate (Doors)
              </span>
              <span className="text-base font-black text-neutral-950 mt-0.5 block">
                {yesRate}%
              </span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl">
              <span className="text-neutral-500 block text-[10px] font-bold uppercase">
                Contact Rate
              </span>
              <span className="text-base font-black text-neutral-950 mt-0.5 block">
                {contactRate}%
              </span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl">
              <span className="text-neutral-500 block text-[10px] font-bold uppercase">
                Close Rate (Contacts)
              </span>
              <span className="text-base font-black text-neutral-950 mt-0.5 block">
                {closeRate}%
              </span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl">
              <span className="text-neutral-500 block text-[10px] font-bold uppercase">
                Doors / Hour
              </span>
              <span className="text-base font-black text-neutral-950 mt-0.5 block">
                {doorsPerHour}
              </span>
            </div>
          </div>
        </div>

        {/* Compared with your average (Requirement #13) */}
        {otherSessions.length > 0 && (
          <div className="py-4 border-b border-neutral-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Compared with your average
            </span>
            <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-3 space-y-2 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">{session.currency} / hour</span>
                <span
                  className={
                    avgRateDiff !== null && avgRateDiff >= 0
                      ? "text-black font-black"
                      : "text-neutral-500 font-bold"
                  }
                >
                  {formatDiff(avgRateDiff, "%")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Doors / hour</span>
                <span
                  className={
                    avgDoorsPerHourDiff !== null && avgDoorsPerHourDiff >= 0
                      ? "text-black font-black"
                      : "text-neutral-500 font-bold"
                  }
                >
                  {formatDiff(avgDoorsPerHourDiff, "%")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Yes rate</span>
                <span
                  className={
                    avgYesRateDiff !== null && avgYesRateDiff >= 0
                      ? "text-black font-black"
                      : "text-neutral-500 font-bold"
                  }
                >
                  {formatDiff(avgYesRateDiff, "%")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Session Note & Experiment (with personal handwritten accent) */}
        {(session.note || session.experiment) && (
          <div className="py-4 border-b border-neutral-100">
            {session.experiment && (
              <div className="mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                  Tested Experiment
                </span>
                <p className="text-sm font-handwriting text-neutral-800 bg-neutral-50 px-3 py-1.5 rounded-lg inline-block">
                  &ldquo;{session.experiment}&rdquo;
                </p>
              </div>
            )}
            {session.note && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                  Personal Note
                </span>
                <p className="text-base font-handwriting text-neutral-900 bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/60 leading-relaxed">
                  &ldquo;{session.note}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="pt-5">
          <button
            onClick={onClose}
            className="w-full h-14 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-neutral-900 active:scale-[0.98] transition-all cursor-pointer"
          >
            DONE
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {confirmDelete && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl text-center">
              <h4 className="text-base font-black text-neutral-900">Delete this session?</h4>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                This action cannot be undone. Historical stats will update.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onDelete(session.id);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-neutral-900"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-full py-2.5 bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-neutral-200"
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
