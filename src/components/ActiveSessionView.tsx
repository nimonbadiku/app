"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ActiveSession,
  DoorAction,
  UserSettingsConfig,
} from "@/types";
import {
  formatTimer,
  formatHourlyRate,
} from "@/lib/formatters";
import {
  Package,
  Ban,
  Plus,
  Minus,
  Sparkles,
  Undo2,
} from "lucide-react";

interface ActiveSessionViewProps {
  session: ActiveSession;
  settings: UserSettingsConfig;
  onUpdateSession: (updated: ActiveSession) => void;
  onEndSession: (note: string, experiment: string) => void;
}

export function ActiveSessionView({
  session,
  settings,
  onUpdateSession,
  onEndSession,
}: ActiveSessionViewProps) {
  // Timestamp-based elapsed seconds calculation
  // iOS suspends JS execution when locked/backgrounded.
  // Elapsed time is ALWAYS calculated as: Date.now() - session.startedAt
  const [now, setNow] = useState<number>(Date.now());
  const [quantityModalOpen, setQuantityModalOpen] = useState<boolean>(false);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [endModalOpen, setEndModalOpen] = useState<boolean>(false);
  const [sessionNote, setSessionNote] = useState<string>("");
  const [sessionExperiment, setSessionExperiment] = useState<string>(
    session.experiment || ""
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Interval is ONLY for refreshing visible number while the app is active
  useEffect(() => {
    const updateTime = () => setNow(Date.now());
    updateTime();

    const intervalId = setInterval(updateTime, 1000);

    const handleWake = () => {
      // Immediately calculate correct elapsed time when iPhone awakens or tab becomes active
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
  }, [session.startedAt]);

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - session.startedAt) / 1000)
  );

  const totalEarnings = session.itemsSold * settings.earningsPerItem;

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  }, []);

  // 1-TAP DOOR ACTIONS
  const handleNo = () => {
    const action: DoorAction = {
      id: crypto.randomUUID(),
      type: "NO",
      items: 0,
      timestamp: Date.now(),
    };

    const updated: ActiveSession = {
      ...session,
      doors: session.doors + 1,
      noCount: session.noCount + 1,
      actionHistory: [action, ...session.actionHistory],
    };

    onUpdateSession(updated);
    showToast("Logged NO");
  };

  const handleNotHome = () => {
    const action: DoorAction = {
      id: crypto.randomUUID(),
      type: "NOT_HOME",
      items: 0,
      timestamp: Date.now(),
    };

    const updated: ActiveSession = {
      ...session,
      doors: session.doors + 1,
      notHomeCount: session.notHomeCount + 1,
      actionHistory: [action, ...session.actionHistory],
    };

    onUpdateSession(updated);
    showToast("Logged NOT HOME");
  };

  // YES opens fast quantity selector
  const handleOpenYesModal = () => {
    setSelectedQuantity(1);
    setQuantityModalOpen(true);
  };

  const handleSaveYes = (qty: number) => {
    const action: DoorAction = {
      id: crypto.randomUUID(),
      type: "YES",
      items: qty,
      timestamp: Date.now(),
    };

    const updated: ActiveSession = {
      ...session,
      doors: session.doors + 1,
      yesCount: session.yesCount + 1,
      itemsSold: session.itemsSold + qty,
      actionHistory: [action, ...session.actionHistory],
    };

    onUpdateSession(updated);
    setQuantityModalOpen(false);
    showToast(`Logged YES (+${qty} item${qty > 1 ? "s" : ""})`);
  };

  // UNDO ACTION
  const handleUndo = () => {
    if (session.actionHistory.length === 0) return;

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
      undoDesc = "Undid NO";
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

  const canUndo = session.actionHistory.length > 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)] max-w-md mx-auto px-6 pt-3 pb-8 justify-between select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* TOP SECTION: EARNINGS & TIME */}
      <div className="text-center pt-3 pb-4">
        {/* Large bold earnings - reference image style: e.g. "340 kr" */}
        <h2 className="text-[64px] leading-tight font-black tracking-tight text-black font-sans">
          {totalEarnings}{" "}
          <span className="text-[52px] font-black text-black">
            {settings.currency}
          </span>
        </h2>

        {/* Subtitle: 01:14:32 · 291 kr / hour */}
        <p className="mt-1 text-sm font-semibold text-neutral-600 tracking-wide flex items-center justify-center gap-2">
          <span className="font-mono text-[15px] font-bold text-neutral-900">
            {formatTimer(elapsedSeconds)}
          </span>
          <span className="text-neutral-400 font-bold">•</span>
          <span className="font-semibold text-neutral-800">
            {formatHourlyRate(totalEarnings, elapsedSeconds, settings.currency)}
          </span>
        </p>

        {/* Subtle experiment / human note tag if active */}
        {session.experiment && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
            <span className="font-handwriting text-sm text-neutral-900 font-semibold">
              &ldquo;{session.experiment}&rdquo;
            </span>
          </div>
        )}
      </div>

      {/* LIVE STATISTICS: 4 COLUMNS (Matching screenshot icons & spacing) */}
      <div className="py-2 px-1">
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* 1. DOORS - Slim door rectangle with knob */}
          <div className="flex flex-col items-center">
            <svg
              className="w-5 h-5 text-neutral-700 stroke-[1.8] mb-1.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect x="5.5" y="3" width="13" height="18" rx="1.5" strokeWidth="1.8" />
              <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-xl font-black text-neutral-950 leading-none">
              {session.doors}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
              DOORS
            </span>
          </div>

          {/* 2. YES - Checkmark inside circle */}
          <div className="flex flex-col items-center">
            <svg
              className="w-5 h-5 text-neutral-700 stroke-[1.8] mb-1.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
              <path
                d="M8.5 12.5L11 15L16 9"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xl font-black text-neutral-950 leading-none">
              {session.yesCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
              YES
            </span>
          </div>

          {/* 3. ITEMS - Isometric parcel box */}
          <div className="flex flex-col items-center">
            <Package className="w-5 h-5 text-neutral-700 stroke-[1.8] mb-1.5" />
            <span className="text-xl font-black text-neutral-950 leading-none">
              {session.itemsSold}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
              ITEMS
            </span>
          </div>

          {/* 4. NO ANSWER - Circle with slash */}
          <div className="flex flex-col items-center">
            <Ban className="w-5 h-5 text-neutral-700 stroke-[1.8] mb-1.5" />
            <span className="text-xl font-black text-neutral-950 leading-none">
              {session.notHomeCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
              NO ANSWER
            </span>
          </div>
        </div>
      </div>

      {/* MAIN ACTION BUTTONS: 3 HUGE THUMB BUTTONS (Reference image layout) */}
      <div className="space-y-3.5 my-3">
        {/* 1. YES: Solid black button */}
        <button
          onClick={handleOpenYesModal}
          className="w-full h-17 bg-black text-white rounded-[22px] flex items-center justify-center gap-3.5 text-xl font-black tracking-wide hover:bg-neutral-900 active:scale-[0.98] transition-all cursor-pointer shadow-sm tap-active"
          aria-label="Door result: Yes sale"
        >
          <div className="w-8 h-8 rounded-full border-[2.2px] border-white flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white stroke-[3.5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span>YES</span>
        </button>

        {/* 2. NO: White button with black border and circular X */}
        <button
          onClick={handleNo}
          className="w-full h-17 bg-white text-black rounded-[22px] flex items-center justify-center gap-3.5 text-xl font-black tracking-wide border-2 border-black hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer tap-active"
          aria-label="Door result: No"
        >
          <div className="w-8 h-8 rounded-full border-[2.2px] border-black flex items-center justify-center">
            <svg
              className="w-4 h-4 text-black stroke-[3.2]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span>NO</span>
        </button>

        {/* 3. NOT HOME: White button with black border and house icon */}
        <button
          onClick={handleNotHome}
          className="w-full h-17 bg-white text-black rounded-[22px] flex items-center justify-center gap-3.5 text-xl font-black tracking-wide border-2 border-black hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer tap-active"
          aria-label="Door result: Not home"
        >
          <svg
            className="w-7 h-7 text-black stroke-[2.2]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21V12H15V21"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>NOT HOME</span>
        </button>
      </div>

      {/* BOTTOM ACTIONS: UNDO & END SESSION */}
      <div className="flex flex-col items-center gap-2 pt-1 pb-1">
        {/* UNDO BUTTON matching reference */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all cursor-pointer ${
            canUndo
              ? "text-neutral-900 hover:bg-neutral-100 active:scale-95"
              : "text-neutral-300 cursor-not-allowed"
          }`}
          aria-label="Undo last door action"
        >
          <Undo2 className="w-4 h-4 stroke-[2.4]" />
          <span>UNDO</span>
          {canUndo && (
            <span className="text-[10px] text-neutral-400 font-normal lowercase">
              ({session.actionHistory[0]?.type.toLowerCase()})
            </span>
          )}
        </button>

        {/* End Session trigger */}
        <button
          onClick={() => setEndModalOpen(true)}
          className="text-[11px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider py-1 cursor-pointer transition-colors"
        >
          End Session
        </button>
      </div>

      {/* QUANTITY PICKER (Opens instantly on YES) */}
      {quantityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-safe border border-neutral-200 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-black text-neutral-950 uppercase tracking-tight">
                How many items?
              </h3>
              <button
                onClick={() => setQuantityModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper: -  1  + */}
            <div className="flex items-center justify-center gap-6 py-7">
              <button
                onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                className="w-14 h-14 rounded-full border-2 border-neutral-300 hover:border-black flex items-center justify-center text-xl font-bold active:scale-95 transition-all text-neutral-900 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-6 h-6 stroke-[2.5]" />
              </button>

              <div className="text-center w-20">
                <span className="text-5xl font-black text-black font-sans">
                  {selectedQuantity}
                </span>
                <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-1">
                  {selectedQuantity === 1 ? "Item" : "Items"}
                </span>
              </div>

              <button
                onClick={() => setSelectedQuantity((q) => q + 1)}
                className="w-14 h-14 rounded-full border-2 border-neutral-300 hover:border-black flex items-center justify-center text-xl font-bold active:scale-95 transition-all text-neutral-900 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex justify-center gap-2 pb-5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedQuantity(num)}
                  className={`w-11 h-11 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                    selectedQuantity === num
                      ? "bg-black text-white border-black"
                      : "bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="text-center text-xs font-semibold text-neutral-500 mb-5">
              +{selectedQuantity * settings.earningsPerItem} {settings.currency} earnings
            </div>

            {/* Large SAVE button */}
            <button
              onClick={() => handleSaveYes(selectedQuantity)}
              className="w-full h-15 bg-black text-white rounded-2xl font-black text-lg uppercase tracking-wider hover:bg-neutral-900 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              SAVE
            </button>
          </div>
        </div>
      )}

      {/* END SESSION CONFIRMATION MODAL */}
      {endModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-safe border border-neutral-200 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <h3 className="text-xl font-black text-neutral-950 uppercase tracking-tight">
              End this session?
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              You logged {session.doors} doors and sold {session.itemsSold} items in{" "}
              {formatTimer(elapsedSeconds)}.
            </p>

            {/* Optional experiment / focus field */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Experiment / Focus (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. New opener, Asked for 2 tickets"
                value={sessionExperiment}
                onChange={(e) => setSessionExperiment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-black font-handwriting text-base"
              />
            </div>

            {/* Optional note field */}
            <div className="mt-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Session Note (optional)
              </label>
              <textarea
                placeholder="e.g. Tested shorter explanation, bad weather..."
                rows={2}
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-black resize-none"
              />
            </div>

            <div className="space-y-2.5 mt-6">
              <button
                onClick={() => {
                  setEndModalOpen(false);
                  onEndSession(sessionNote, sessionExperiment);
                }}
                className="w-full h-14 bg-black text-white rounded-xl font-black text-base uppercase tracking-wider hover:bg-neutral-900 active:scale-[0.98] transition-all cursor-pointer"
              >
                END SESSION
              </button>
              <button
                onClick={() => setEndModalOpen(false)}
                className="w-full h-14 bg-white text-neutral-800 rounded-xl font-bold text-sm uppercase tracking-wider border border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                KEEP SELLING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
