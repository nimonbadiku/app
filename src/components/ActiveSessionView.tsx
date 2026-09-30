"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  ActiveSession,
  DoorAction,
  UserSettingsConfig,
} from "@/types";
import {
  formatTimer,
  formatHourlyRate,
  calculateHourlyRateNumber,
  calculateDoorsPerHour,
  formatTimeShort,
} from "@/lib/formatters";
import {
  Plus,
  Minus,
  RotateCcw,
  Pause,
  Play,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flag,
  Target,
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { playTap, playSuccess, playUndo, playMilestone, triggerHaptic } from "@/lib/audio";

interface ActiveSessionViewProps {
  session: ActiveSession;
  settings: UserSettingsConfig;
  onUpdateSession: (updated: ActiveSession) => void;
  onEndSession: (note: string, experiment: string, territory?: string) => void;
}

const COMMON_OBJECTIONS = [
  "Not interested",
  "Price / Too expensive",
  "Has provider",
  "No time / Busy",
  "Talk to spouse",
  "Rude / Quick door",
];

export function ActiveSessionView({
  session,
  settings,
  onUpdateSession,
  onEndSession,
}: ActiveSessionViewProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [quantityModalOpen, setQuantityModalOpen] = useState<boolean>(false);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [yesNote, setYesNote] = useState<string>("");
  const [endModalOpen, setEndModalOpen] = useState<boolean>(false);
  const [sessionNote, setSessionNote] = useState<string>("");
  const [sessionExperiment, setSessionExperiment] = useState<string>(
    session.experiment || ""
  );
  const [sessionTerritory, setSessionTerritory] = useState<string>(
    session.territory || ""
  );
  const [showRecentDoors, setShowRecentDoors] = useState<boolean>(false);
  const [showObjectionSheet, setShowObjectionSheet] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [tempNoteText, setTempNoteText] = useState<string>("");
  const milestoneTriggeredRef = useRef<boolean>(false);

  const soundOn = settings.soundEnabled ?? true;
  const hapticsOn = settings.hapticsEnabled ?? true;

  // Exact timestamp-based calculation
  useEffect(() => {
    const updateTime = () => setNow(Date.now());
    const intervalId = setInterval(updateTime, 1000);

    const handleWake = () => {
      updateTime();
    };

    window.addEventListener("visibilitychange", handleWake);
    window.addEventListener("focus", handleWake);
    window.addEventListener("pageshow", handleWake);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("visibilitychange", handleWake);
      window.removeEventListener("focus", handleWake);
      window.removeEventListener("pageshow", handleWake);
    };
  }, [session.startedAt, session.isPaused]);

  // Compute exact active duration excluding paused intervals
  const totalPaused =
    (session.totalPausedMs || 0) +
    (session.isPaused && session.pausedAt ? now - session.pausedAt : 0);

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - session.startedAt - totalPaused) / 1000)
  );

  const totalEarnings = session.itemsSold * settings.earningsPerItem;
  const doorsPerHour = calculateDoorsPerHour(session.doors, elapsedSeconds);
  const yesRate = session.doors > 0 ? ((session.yesCount / session.doors) * 100).toFixed(0) : "0";

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  }, []);

  const checkGoal = useCallback((doorsCount: number) => {
    if (
      session.targetDoors &&
      doorsCount === session.targetDoors &&
      doorsCount > 0 &&
      !milestoneTriggeredRef.current
    ) {
      milestoneTriggeredRef.current = true;
      playMilestone(soundOn);
      triggerHaptic("milestone", hapticsOn);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.25 },
        colors: ["#000000", "#71717A", "#FFFFFF", "#F59E0B"],
      });
      showToast(`🎯 Goal Reached: ${session.targetDoors} doors knocked!`);
    }
  }, [session.targetDoors, soundOn, hapticsOn, showToast]);

  // 1-TAP DOOR ACTIONS
  const handleNo = (tag?: string) => {
    playTap(soundOn);
    triggerHaptic("medium", hapticsOn);

    const nextDoors = session.doors + 1;
    checkGoal(nextDoors);

    const action: DoorAction = {
      id: crypto.randomUUID(),
      type: "NO",
      items: 0,
      timestamp: Date.now(),
      tag,
    };

    const updated: ActiveSession = {
      ...session,
      doors: nextDoors,
      noCount: session.noCount + 1,
      actionHistory: [action, ...session.actionHistory],
    };

    onUpdateSession(updated);
    setShowObjectionSheet(false);
    showToast(tag ? `Logged NO (${tag})` : "Logged NO");
  };

  const handleNotHome = () => {
    playTap(soundOn);
    triggerHaptic("light", hapticsOn);

    const nextDoors = session.doors + 1;
    checkGoal(nextDoors);

    const action: DoorAction = {
      id: crypto.randomUUID(),
      type: "NOT_HOME",
      items: 0,
      timestamp: Date.now(),
    };

    const updated: ActiveSession = {
      ...session,
      doors: nextDoors,
      notHomeCount: session.notHomeCount + 1,
      actionHistory: [action, ...session.actionHistory],
    };

    onUpdateSession(updated);
    showToast("Logged NOT HOME");
  };

  const handleOpenYesModal = () => {
    playTap(soundOn);
    triggerHaptic("light", hapticsOn);
    setSelectedQuantity(1);
    setYesNote("");
    setQuantityModalOpen(true);
  };

  const handleSaveYes = (qty: number, note?: string) => {
    playSuccess(soundOn);
    triggerHaptic("success", hapticsOn);

    const nextDoors = session.doors + 1;
    checkGoal(nextDoors);

    const action: DoorAction = {
      id: crypto.randomUUID(),
      type: "YES",
      items: qty,
      timestamp: Date.now(),
      tag: note?.trim() || undefined,
    };

    const updated: ActiveSession = {
      ...session,
      doors: nextDoors,
      yesCount: session.yesCount + 1,
      itemsSold: session.itemsSold + qty,
      actionHistory: [action, ...session.actionHistory],
    };

    onUpdateSession(updated);
    setQuantityModalOpen(false);
    showToast(`🎉 YES! +${qty} item${qty > 1 ? "s" : ""} (+${qty * settings.earningsPerItem} ${settings.currency})`);
  };

  // UNDO ACTION
  const handleUndo = () => {
    if (session.actionHistory.length === 0) return;

    playUndo(soundOn);
    triggerHaptic("undo", hapticsOn);

    const [lastAction, ...remainingHistory] = session.actionHistory;
    let updatedDoors = Math.max(0, session.doors - 1);
    let updatedYes = session.yesCount;
    let updatedNo = session.noCount;
    let updatedNotHome = session.notHomeCount;
    let updatedItems = session.itemsSold;
    let undoDesc = "";

    if (lastAction.type === "YES") {
      updatedYes = Math.max(0, updatedYes - 1);
      updatedItems = Math.max(0, updatedItems - lastAction.items);
      undoDesc = `Undid YES (${lastAction.items} items)`;
    } else if (lastAction.type === "NO") {
      updatedNo = Math.max(0, updatedNo - 1);
      undoDesc = lastAction.tag ? `Undid NO (${lastAction.tag})` : "Undid NO";
    } else if (lastAction.type === "NOT_HOME") {
      updatedNotHome = Math.max(0, updatedNotHome - 1);
      undoDesc = "Undid NOT HOME";
    }

    const updated: ActiveSession = {
      ...session,
      doors: updatedDoors,
      yesCount: updatedYes,
      noCount: updatedNo,
      notHomeCount: updatedNotHome,
      itemsSold: updatedItems,
      actionHistory: remainingHistory,
    };

    onUpdateSession(updated);
    showToast(undoDesc);
  };

  // DELETE SPECIFIC RECENT ACTION
  const handleDeleteAction = (actionId: string) => {
    playUndo(soundOn);
    triggerHaptic("undo", hapticsOn);

    const targetAction = session.actionHistory.find((a) => a.id === actionId);
    if (!targetAction) return;

    const remaining = session.actionHistory.filter((a) => a.id !== actionId);
    let updatedDoors = Math.max(0, session.doors - 1);
    let updatedYes = session.yesCount;
    let updatedNo = session.noCount;
    let updatedNotHome = session.notHomeCount;
    let updatedItems = session.itemsSold;

    if (targetAction.type === "YES") {
      updatedYes = Math.max(0, updatedYes - 1);
      updatedItems = Math.max(0, updatedItems - targetAction.items);
    } else if (targetAction.type === "NO") {
      updatedNo = Math.max(0, updatedNo - 1);
    } else if (targetAction.type === "NOT_HOME") {
      updatedNotHome = Math.max(0, updatedNotHome - 1);
    }

    const updated: ActiveSession = {
      ...session,
      doors: updatedDoors,
      yesCount: updatedYes,
      noCount: updatedNo,
      notHomeCount: updatedNotHome,
      itemsSold: updatedItems,
      actionHistory: remaining,
    };

    onUpdateSession(updated);
    showToast("Removed door log");
  };

  // PAUSE / RESUME SESSION
  const handleTogglePause = () => {
    playTap(soundOn);
    triggerHaptic("medium", hapticsOn);

    if (session.isPaused) {
      const pauseDuration = session.pausedAt ? Date.now() - session.pausedAt : 0;
      const updated: ActiveSession = {
        ...session,
        isPaused: false,
        pausedAt: undefined,
        totalPausedMs: (session.totalPausedMs || 0) + pauseDuration,
      };
      onUpdateSession(updated);
      showToast("Route Resumed");
    } else {
      const updated: ActiveSession = {
        ...session,
        isPaused: true,
        pausedAt: Date.now(),
      };
      onUpdateSession(updated);
      showToast("Route Paused (Break time)");
    }
  };

  const handleEndSubmit = () => {
    if (session.yesCount > 0 || session.doors >= 20) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.3 },
      });
    }
    setEndModalOpen(false);
    onEndSession(sessionNote, sessionExperiment, sessionTerritory);
  };

  const canUndo = session.actionHistory.length > 0;
  const targetPercent =
    session.targetDoors && session.targetDoors > 0
      ? Math.min(100, Math.round((session.doors / session.targetDoors) * 100))
      : null;

  return (
    <div className="flex flex-col max-w-md mx-auto px-4 pt-1 pb-safe-nav select-none min-h-[calc(100dvh-130px)] justify-between">
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#0A0A0C] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl animate-slide-down-notch flex items-center gap-1.5 border border-white/20">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP SECTION: Live Pacing & Goal Card */}
      <div className="space-y-2.5">
        {/* Live Timer & Pause bar */}
        <div className="flex items-center justify-between px-4 py-2.5 ios-card">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {session.isPaused ? (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              )}
            </span>
            <span className="text-[15px] font-bold font-mono tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatTimer(elapsedSeconds)}
            </span>
            {session.isPaused && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded-md">
                Paused
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono text-neutral-700 dark:text-neutral-300">
              {formatHourlyRate(totalEarnings, elapsedSeconds, settings.currency)}
            </span>
            <button
              onClick={handleTogglePause}
              className="tap-spring p-1.5 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              aria-label={session.isPaused ? "Resume route" : "Pause route"}
            >
              {session.isPaused ? (
                <Play className="w-4 h-4 fill-current text-emerald-500" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Target Goal Progress Bar (if set) */}
        {targetPercent !== null && (
          <div className="px-4 py-2.5 ios-card">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                <Target className="w-3.5 h-3.5" /> Door Target
              </span>
              <span className="tabular-nums font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {session.doors} / {session.targetDoors} ({targetPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#F4F5F7] dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
                style={{ width: `${targetPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* HERO EARNINGS DISPLAY */}
        <div className="text-center py-2">
          <p className="text-[48px] leading-none font-black tabular-nums font-mono tracking-tight text-neutral-950 dark:text-white">
            {totalEarnings}{" "}
            <span className="text-[24px] font-bold text-neutral-400 font-sans">
              {settings.currency}
            </span>
          </p>
          <div className="flex items-center justify-center gap-2.5 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
            <span>{doorsPerHour} doors/h</span>
            <span>•</span>
            <span>{yesRate}% yes rate</span>
            {session.itemsSold > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{session.itemsSold} sold</span>
              </>
            )}
          </div>
        </div>

        {/* LIVE STATS COUNTER ROW */}
        <div className="grid grid-cols-4 gap-2">
          <div className="ios-card p-3 text-center">
            <p className="text-[22px] font-black tabular-nums font-mono text-neutral-950 dark:text-white leading-tight">
              {session.doors}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
              Doors
            </p>
          </div>

          <div className="ios-card p-3 text-center">
            <p className="text-[22px] font-black tabular-nums font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
              {session.yesCount}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
              Yes
            </p>
          </div>

          <div className="ios-card p-3 text-center">
            <p className="text-[22px] font-black tabular-nums font-mono text-neutral-950 dark:text-white leading-tight">
              {session.noCount}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
              No
            </p>
          </div>

          <div className="ios-card p-3 text-center">
            <p className="text-[22px] font-black tabular-nums font-mono text-neutral-400 leading-tight">
              {session.notHomeCount}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5 truncate">
              No Ans.
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE: ACTION BUTTONS (Tactile, Ergonomic Thumb Zone) */}
      <div className="my-auto py-3 space-y-3">
        {/* Primary YES Action */}
        <button
          onClick={handleOpenYesModal}
          className="tap-spring w-full h-[78px] bg-black text-white dark:bg-white dark:text-black rounded-3xl text-[21px] font-black flex items-center justify-between px-6 shadow-[0_8px_25px_rgba(0,0,0,0.14)] border border-white/20 dark:border-black/20 cursor-pointer"
          aria-label="Door result: Yes sale"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 dark:bg-black/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span>YES (Sale)</span>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 dark:bg-black/10 text-white font-mono">
            +{settings.earningsPerItem} {settings.currency}
          </span>
        </button>

        {/* Secondary Row: NO and NOT HOME */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <button
              onClick={() => handleNo()}
              className="tap-spring w-full h-[74px] ios-card text-neutral-900 dark:text-white text-[18px] font-black flex flex-col items-center justify-center cursor-pointer"
              aria-label="Door result: No"
            >
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-neutral-400" />
                <span>No</span>
              </div>
            </button>
            <button
              onClick={() => setShowObjectionSheet(true)}
              className="tap-spring absolute right-2.5 top-2.5 p-1 text-neutral-400 hover:text-black dark:hover:text-white rounded-full cursor-pointer"
              title="Tag objection reason"
              aria-label="Tag objection reason"
            >
              <Tag className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleNotHome}
            className="tap-spring h-[74px] ios-card text-neutral-500 dark:text-neutral-400 text-[16px] font-bold flex flex-col items-center justify-center cursor-pointer"
            aria-label="Door result: Not home"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-neutral-400" />
              <span>Not Home</span>
            </div>
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: Live Door Feed & Quick Tools */}
      <div className="space-y-2.5">
        {/* Recent Doors Toggle Bar */}
        {session.actionHistory.length > 0 && (
          <div className="ios-card overflow-hidden">
            <button
              onClick={() => setShowRecentDoors(!showRecentDoors)}
              className="tap-spring w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black dark:bg-white inline-block"></span>
                Recent Doors ({session.actionHistory.length})
              </span>
              {showRecentDoors ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showRecentDoors && (
              <div className="px-3.5 pb-3 pt-1 space-y-1.5 max-h-40 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                {session.actionHistory.slice(0, 8).map((action, idx) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between pt-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        #{session.doors - idx} • {formatTimeShort(action.timestamp)}
                      </span>
                      <span
                        className={`font-bold ${
                          action.type === "YES"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : action.type === "NO"
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-400"
                        }`}
                      >
                        {action.type === "YES"
                          ? `Yes (+${action.items})`
                          : action.type === "NO"
                          ? action.tag
                            ? `No (${action.tag})`
                            : "No"
                          : "Not Home"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      className="tap-spring p-1 text-neutral-300 hover:text-red-500 cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Tools Row (Undo, Note, Finish) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`tap-spring flex-1 flex items-center justify-center gap-1.5 h-11 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              canUndo
                ? "ios-card text-neutral-900 dark:text-neutral-100"
                : "bg-neutral-100/60 dark:bg-neutral-900/40 text-neutral-300 dark:text-neutral-700 border-transparent cursor-not-allowed"
            }`}
            aria-label="Undo last door action"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            onClick={() => {
              playTap(soundOn);
              setTempNoteText(sessionNote);
              setNoteModalOpen(true);
            }}
            className="tap-spring flex-1 flex items-center justify-center gap-1.5 h-11 rounded-2xl text-xs font-bold ios-card text-neutral-900 dark:text-neutral-100 cursor-pointer"
            aria-label="Add note to session"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>

          <button
            onClick={() => {
              playTap(soundOn);
              triggerHaptic("medium", hapticsOn);
              setEndModalOpen(true);
            }}
            className="tap-spring flex-1 flex items-center justify-center gap-1.5 h-11 rounded-2xl text-xs font-extrabold bg-black text-white dark:bg-white dark:text-black border border-transparent shadow-xs cursor-pointer"
            aria-label="Finish and end session"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: QUANTITY SELECTOR SHEET */}
      {quantityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 p-2 sm:p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#18181B] rounded-[28px] p-5 pb-safe animate-sheet-up border border-black/5 dark:border-white/10 shadow-2xl">
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[18px] font-black text-neutral-950 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                How many items sold?
              </h3>
              <button
                onClick={() => setQuantityModalOpen(false)}
                className="tap-spring text-neutral-400 hover:text-black dark:hover:text-white p-1 text-sm font-semibold rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Stepper with Large Number */}
            <div className="flex items-center justify-center gap-6 py-5">
              <button
                onClick={() => {
                  playTap(soundOn);
                  setSelectedQuantity((q) => Math.max(1, q - 1));
                }}
                className="tap-spring w-[56px] h-[56px] rounded-full bg-[#F4F5F7] dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white border border-black/5 dark:border-white/10 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5 stroke-[2.4]" />
              </button>

              <div className="text-center w-20">
                <span className="text-[54px] leading-none font-black tabular-nums font-mono text-neutral-950 dark:text-white">
                  {selectedQuantity}
                </span>
                <span className="block text-[11px] font-bold text-neutral-400 uppercase mt-1">
                  {selectedQuantity === 1 ? "Item" : "Items"}
                </span>
              </div>

              <button
                onClick={() => {
                  playTap(soundOn);
                  setSelectedQuantity((q) => q + 1);
                }}
                className="tap-spring w-[56px] h-[56px] rounded-full bg-[#F4F5F7] dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white border border-black/5 dark:border-white/10 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5 stroke-[2.4]" />
              </button>
            </div>

            {/* Quick Quantity Pills */}
            <div className="flex justify-center gap-1.5 pb-4">
              {[1, 2, 3, 4, 5, 8].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    playTap(soundOn);
                    setSelectedQuantity(num);
                  }}
                  className={`tap-spring w-11 h-11 rounded-2xl text-[15px] font-black font-mono transition-all cursor-pointer ${
                    selectedQuantity === num
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                      : "bg-[#F4F5F7] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Live Commission & Retail Preview */}
            <div className="text-center p-3 rounded-2xl bg-[#F6F7F9] dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.05] mb-4">
              <span className="text-[15px] font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{selectedQuantity * settings.earningsPerItem} {settings.currency} Commission
              </span>
              <span className="block text-[11px] font-medium text-neutral-400 mt-0.5">
                Retail total: {selectedQuantity * settings.pricePerItem} {settings.currency}
              </span>
            </div>

            {/* Optional Sale Note */}
            <input
              type="text"
              placeholder="Sale note (e.g. 2nd floor, neighbor bundle)"
              value={yesNote}
              onChange={(e) => setYesNote(e.target.value)}
              className="w-full mb-3 px-3.5 py-2.5 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800 text-[13px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
            />

            {/* Save Button */}
            <button
              onClick={() => handleSaveYes(selectedQuantity, yesNote)}
              className="tap-spring w-full h-[58px] bg-black text-white dark:bg-white dark:text-black rounded-3xl font-black text-[17px] shadow-md cursor-pointer"
            >
              Save Sale
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: OBJECTION TAG SHEET */}
      {showObjectionSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 p-2 sm:p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#18181B] rounded-[28px] p-5 pb-safe animate-sheet-up border border-black/5 dark:border-white/10 shadow-2xl">
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[17px] font-black text-neutral-950 dark:text-white">
                Log NO with Reason
              </h3>
              <button
                onClick={() => setShowObjectionSheet(false)}
                className="tap-spring text-neutral-400 hover:text-black dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-medium">
              Select the objection to track patterns:
            </p>

            <div className="space-y-2">
              {COMMON_OBJECTIONS.map((obj) => (
                <button
                  key={obj}
                  onClick={() => handleNo(obj)}
                  className="tap-spring w-full h-12 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800 hover:bg-neutral-200/70 text-left px-4 text-[14px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-between cursor-pointer"
                >
                  <span>{obj}</span>
                  <span className="text-xs text-neutral-400 font-mono">Log</span>
                </button>
              ))}

              <button
                onClick={() => handleNo()}
                className="tap-spring w-full h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-extrabold text-[14px] mt-2 cursor-pointer"
              >
                Log General NO (No Tag)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NOTE QUICK INPUT */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#18181B] rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-2xl">
            <h3 className="text-[17px] font-black text-neutral-950 dark:text-white mb-2">
              Route Note
            </h3>
            <textarea
              rows={3}
              placeholder="e.g. Started at corner of Elm St, lots of dogs, return to #42 at 5 PM..."
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setSessionNote(tempNoteText);
                  setNoteModalOpen(false);
                  showToast("Note saved");
                }}
                className="tap-spring flex-1 h-12 bg-black text-white dark:bg-white dark:text-black font-extrabold rounded-2xl cursor-pointer"
              >
                Save Note
              </button>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="tap-spring flex-1 h-12 bg-[#F4F5F7] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: END SESSION CONFIRMATION & SUMMARY */}
      {endModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 p-2 sm:p-4">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-[#18181B] rounded-[28px] p-5 pb-safe animate-sheet-up border border-black/5 dark:border-white/10 shadow-2xl">
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-3" />

            <h3 className="text-[20px] font-black text-neutral-950 dark:text-white">
              Complete Route?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
              Here is your performance summary for this session:
            </p>

            {/* Session Summary Card */}
            <div className="my-4 p-4 rounded-2xl bg-[#F6F7F9] dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.05] text-center">
              <p className="text-[36px] font-black text-neutral-950 dark:text-white tabular-nums font-mono">
                {totalEarnings}{" "}
                <span className="text-lg font-bold text-neutral-400 font-sans">
                  {settings.currency}
                </span>
              </p>
              <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300 tabular-nums mt-1 font-mono">
                {session.doors} doors • {session.yesCount} yes • {session.itemsSold} items • {formatTimer(elapsedSeconds)}
              </p>
              <p className="text-[11px] font-semibold text-neutral-400 mt-1">
                Pacing: {formatHourlyRate(totalEarnings, elapsedSeconds, settings.currency)} ({doorsPerHour} doors/h)
              </p>
            </div>

            {/* Territory / Neighborhood input */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 block">
                  Territory / Area (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maple Ridge, Sector 4"
                  value={sessionTerritory}
                  onChange={(e) => setSessionTerritory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white focus:outline-none placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 block">
                  Pitch Focus / Strategy
                </label>
                <input
                  type="text"
                  placeholder="e.g. Direct hook, 2-item bundle pitch"
                  value={sessionExperiment}
                  onChange={(e) => setSessionExperiment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white focus:outline-none placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 block">
                  Session Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any objections, weather, or callback notes..."
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white focus:outline-none resize-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* End session action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleEndSubmit}
                className="tap-spring w-full h-[56px] bg-black text-white dark:bg-white dark:text-black rounded-3xl font-extrabold text-[16px] shadow-sm cursor-pointer"
              >
                Save & View in History
              </button>
              <button
                onClick={() => setEndModalOpen(false)}
                className="tap-spring w-full h-[48px] text-neutral-500 dark:text-neutral-400 font-bold text-[14px] cursor-pointer"
              >
                Keep Selling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
