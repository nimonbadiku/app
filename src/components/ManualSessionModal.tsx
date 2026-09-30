"use client";

import React, { useState } from "react";
import { SessionRecord, UserSettingsConfig } from "@/types";
import { playSuccess } from "@/lib/audio";
import { PlusCircle, Calendar, Clock, DoorClosed, CheckCircle2 } from "lucide-react";

interface ManualSessionModalProps {
  settings: UserSettingsConfig;
  onSave: (session: SessionRecord) => void;
  onClose: () => void;
}

export function ManualSessionModal({
  settings,
  onSave,
  onClose,
}: ManualSessionModalProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [durationMinutes, setDurationMinutes] = useState<string>("60");
  const [doors, setDoors] = useState<string>("30");
  const [yesCount, setYesCount] = useState<string>("4");
  const [itemsSold, setItemsSold] = useState<string>("5");
  const [notHomeCount, setNotHomeCount] = useState<string>("8");
  const [territory, setTerritory] = useState<string>("");
  const [experiment, setExperiment] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const soundOn = settings.soundEnabled ?? true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dNum = Math.max(0, parseInt(doors) || 0);
    const yNum = Math.max(0, parseInt(yesCount) || 0);
    const iNum = Math.max(yNum, parseInt(itemsSold) || yNum);
    const nhNum = Math.max(0, parseInt(notHomeCount) || 0);
    const noNum = Math.max(0, dNum - yNum - nhNum);
    const durSec = Math.max(60, (parseInt(durationMinutes) || 60) * 60);

    const startTime = new Date(date).getTime() || Date.now() - durSec * 1000;
    const endTime = startTime + durSec * 1000;

    const earnings = iNum * settings.earningsPerItem;

    const newRecord: SessionRecord = {
      id: crypto.randomUUID(),
      startedAt: new Date(startTime).toISOString(),
      endedAt: new Date(endTime).toISOString(),
      durationSeconds: durSec,
      doors: dNum,
      yesCount: yNum,
      noCount: noNum,
      notHomeCount: nhNum,
      itemsSold: iNum,
      earnings,
      currency: settings.currency,
      earningsPerItem: settings.earningsPerItem,
      territory: territory.trim() || null,
      experiment: experiment.trim() || null,
      note: note.trim() || null,
      createdAt: new Date().toISOString(),
    };

    playSuccess(soundOn);
    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 p-2 sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#18181B] rounded-[28px] p-5 pb-safe animate-sheet-up border border-black/5 dark:border-white/10 shadow-2xl">
        <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[19px] font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Add Past Route
          </h3>
          <button
            onClick={onClose}
            className="tap-spring text-neutral-400 hover:text-black dark:hover:text-white p-1 text-sm font-semibold rounded-full"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white font-mono font-bold focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Duration (mins)
              </label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white font-mono font-bold focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Doors & Sales */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 flex items-center gap-1">
                <DoorClosed className="w-3 h-3" /> Doors
              </label>
              <input
                type="number"
                min="0"
                value={doors}
                onChange={(e) => setDoors(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white font-mono font-bold focus:outline-none text-center"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sales
              </label>
              <input
                type="number"
                min="0"
                value={yesCount}
                onChange={(e) => setYesCount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-emerald-600 dark:text-emerald-400 font-black font-mono focus:outline-none text-center"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                Items Sold
              </label>
              <input
                type="number"
                min="0"
                value={itemsSold}
                onChange={(e) => setItemsSold(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white font-mono font-bold focus:outline-none text-center"
                required
              />
            </div>
          </div>

          {/* Not Home Count */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 block">
              Not Home / No Answer Doors
            </label>
            <input
              type="number"
              min="0"
              value={notHomeCount}
              onChange={(e) => setNotHomeCount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[14px] text-neutral-900 dark:text-white font-mono font-bold focus:outline-none"
            />
          </div>

          {/* Territory & Pitch Focus */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 block">
                Territory
              </label>
              <input
                type="text"
                placeholder="Sector 5"
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[13px] text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 block">
                Pitch Focus
              </label>
              <input
                type="text"
                placeholder="2-Question Hook"
                value={experiment}
                onChange={(e) => setExperiment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[13px] text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 block">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Session notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F4F5F7] dark:bg-neutral-800 text-[13px] text-neutral-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="tap-spring w-full h-13 bg-black text-white dark:bg-white dark:text-black font-extrabold rounded-3xl text-[16px] mt-2 cursor-pointer shadow-sm"
          >
            Save Route Record
          </button>
        </form>
      </div>
    </div>
  );
}
