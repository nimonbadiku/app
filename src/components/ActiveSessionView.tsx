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
  Plus,
  Minus,
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
    <div className="flex flex-col max-w-md mx-auto px-5 pt-2 pb-28 select-none min-h-[calc(100dvh-120px)]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* Earnings + time — one quiet block */}
      <div className="text-center pt-2">
        <p className="text-[40px] leading-none font-bold tabular-nums tracking-tight text-neutral-950">
          {totalEarnings} <span className="text-[22px] font-semibold text-neutral-400">{settings.currency}</span>
        </p>
        <p className="mt-1.5 text-[13px] font-medium text-neutral-400 tabular-nums">
          {formatTimer(elapsedSeconds)} · {formatHourlyRate(totalEarnings, elapsedSeconds, settings.currency)}
        </p>
      </div>

      {/* Live counts — text only, dividers, no icon soup */}
      <div className="mt-4 flex items-center justify-center divide-x divide-neutral-200/80">
        {[
          { v: session.doors, l: "Doors" },
          { v: session.yesCount, l: "Yes" },
          { v: session.itemsSold, l: "Items" },
          { v: session.notHomeCount, l: "No ans." },
        ].map((s) => (
          <div key={s.l} className="px-4 text-center">
            <p className="text-[19px] font-bold tabular-nums text-neutral-900 leading-none">{s.v}</p>
            <p className="text-[10px] font-medium text-neutral-400 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Spacer pushes the action buttons into thumb reach */}
      <div className="flex-1 min-h-4" />

      <div className="space-y-2.5">
        <button
          onClick={handleOpenYesModal}
          className="w-full h-[68px] bg-black text-white rounded-2xl text-[19px] font-bold active:scale-[0.98] transition-transform cursor-pointer"
          aria-label="Door result: Yes sale"
        >
          Yes
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleNo}
            className="h-[68px] bg-white text-neutral-900 rounded-2xl text-[17px] font-bold border border-neutral-300 active:scale-[0.98] transition-transform cursor-pointer"
            aria-label="Door result: No"
          >
            No
          </button>
          <button
            onClick={handleNotHome}
            className="h-[68px] bg-white text-neutral-500 rounded-2xl text-[15px] font-semibold border border-neutral-200 active:scale-[0.98] transition-transform cursor-pointer"
            aria-label="Door result: Not home"
          >
            Not home
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`text-xs font-medium px-4 py-2 cursor-pointer ${
            canUndo ? "text-neutral-400" : "text-neutral-200"
          }`}
          aria-label="Undo last door action"
        >
          Undo
        </button>

        <span className="w-px h-3.5 bg-neutral-200" />

        <button
          onClick={() => setEndModalOpen(true)}
          className="text-xs font-medium text-neutral-400 px-4 py-2 cursor-pointer"
        >
          End session
        </button>
      </div>

      {quantityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-t-[24px] p-5 pb-safe">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-neutral-950">
                How many?
              </h3>
              <button
                onClick={() => setQuantityModalOpen(false)}
                className="text-neutral-400 p-2 -mr-2 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 py-6">
              <button
                onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                className="w-[52px] h-[52px] rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 active:scale-95 transition-transform cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5 stroke-[2.2]" />
              </button>

              <div className="text-center w-16">
                <span className="text-[44px] leading-none font-bold tabular-nums text-neutral-950">
                  {selectedQuantity}
                </span>
              </div>

              <button
                onClick={() => setSelectedQuantity((q) => q + 1)}
                className="w-[52px] h-[52px] rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 active:scale-95 transition-transform cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            <div className="flex justify-center gap-2 pb-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedQuantity(num)}
                  className={`w-10 h-10 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    selectedQuantity === num
                      ? "bg-black text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="text-center text-[13px] text-neutral-400 mb-4 tabular-nums">
              +{selectedQuantity * settings.earningsPerItem} {settings.currency}
            </div>

            <button
              onClick={() => handleSaveYes(selectedQuantity)}
              className="w-full h-[56px] bg-black text-white rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-transform cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {endModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-t-[24px] p-5 pb-safe">
            <h3 className="text-[17px] font-bold text-neutral-950">
              End session?
            </h3>
            <p className="text-[13px] text-neutral-500 mt-1 tabular-nums">
              {session.doors} doors · {session.itemsSold} items ·{" "}
              {formatTimer(elapsedSeconds)}
            </p>

            <div className="mt-4 space-y-2.5">
              <input
                type="text"
                placeholder="Focus (optional)"
                value={sessionExperiment}
                onChange={(e) => setSessionExperiment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 text-[15px] focus:outline-none placeholder:text-neutral-400"
              />
              <textarea
                placeholder="Note (optional)"
                rows={2}
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 text-[15px] focus:outline-none resize-none placeholder:text-neutral-400"
              />
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  setEndModalOpen(false);
                  onEndSession(sessionNote, sessionExperiment);
                }}
                className="w-full h-[54px] bg-black text-white rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-transform cursor-pointer"
              >
                End session
              </button>
              <button
                onClick={() => setEndModalOpen(false)}
                className="w-full h-[50px] text-neutral-500 font-semibold text-[15px] cursor-pointer"
              >
                Keep selling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
