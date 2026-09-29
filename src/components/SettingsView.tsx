"use client";

import React, { useState } from "react";
import { UserSettingsConfig, SessionRecord } from "@/types";
import {
  Save,
  Download,
  Trash2,
  RefreshCw,
  Smartphone,
  Check,
  AlertCircle,
  Wifi,
} from "lucide-react";

interface SettingsViewProps {
  settings: UserSettingsConfig;
  onSaveSettings: (settings: UserSettingsConfig) => Promise<void>;
  sessions: SessionRecord[];
  onClearData: () => Promise<void>;
  onSyncOffline: () => Promise<void>;
  offlinePendingCount: number;
}

export function SettingsView({
  settings,
  onSaveSettings,
  sessions,
  onClearData,
  onSyncOffline,
  offlinePendingCount,
}: SettingsViewProps) {
  const [earningsPerItem, setEarningsPerItem] = useState(
    settings.earningsPerItem.toString()
  );
  const [pricePerItem, setPricePerItem] = useState(
    settings.pricePerItem.toString()
  );
  const [currency, setCurrency] = useState(settings.currency);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        earningsPerItem: Math.max(0, parseFloat(earningsPerItem) || 20),
        pricePerItem: Math.max(0, parseFloat(pricePerItem) || 50),
        currency: currency.trim() || "kr",
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `doortrack-export-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (sessions.length === 0) return;
    const headers = [
      "ID",
      "Date",
      "StartedAt",
      "EndedAt",
      "DurationSeconds",
      "Doors",
      "Yes",
      "No",
      "NotHome",
      "ItemsSold",
      "Earnings",
      "Currency",
      "Experiment",
      "Note",
    ];

    const rows = sessions.map((s) => [
      s.id,
      s.startedAt.slice(0, 10),
      s.startedAt,
      s.endedAt,
      s.durationSeconds,
      s.doors,
      s.yesCount,
      s.noCount,
      s.notHomeCount,
      s.itemsSold,
      s.earnings,
      s.currency,
      `"${(s.experiment || "").replace(/"/g, '""')}"`,
      `"${(s.note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `doortrack-sessions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-28 space-y-6">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950">
          Settings
        </h2>
        <p className="text-xs text-neutral-500 font-medium">
          Customize commission, units & exports
        </p>
      </div>

      {/* EARNINGS CONFIGURATION FORM */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs space-y-4"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">
          Earnings & Commission
        </span>

        <div>
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
            My Earnings Per Item
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              value={earningsPerItem}
              onChange={(e) => setEarningsPerItem(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold focus:outline-none focus:border-black pr-14"
              required
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-neutral-500">
              {currency}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Your personal commission credited per sold item.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
            Retail Price Per Item
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold focus:outline-none focus:border-black pr-14"
              required
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-neutral-500">
              {currency}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
            Currency Label
          </label>
          <div className="flex gap-2">
            {["kr", "DKK", "$", "€", "£"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  currency === c
                    ? "bg-black text-white border-black"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full h-12 bg-black text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-neutral-900 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>SAVED</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? "SAVING..." : "SAVE SETTINGS"}</span>
            </>
          )}
        </button>
      </form>

      {/* OFFLINE & SYNC STATUS */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
          Offline & Sync Status
        </span>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-neutral-800" />
            <span className="text-xs font-bold text-neutral-900">
              {offlinePendingCount > 0
                ? `${offlinePendingCount} session(s) pending sync`
                : "All sessions synchronized"}
            </span>
          </div>
          {offlinePendingCount > 0 && (
            <button
              onClick={async () => {
                setIsSyncing(true);
                await onSyncOffline();
                setIsSyncing(false);
              }}
              disabled={isSyncing}
              className="text-xs px-3 py-1 bg-black text-white rounded-lg font-bold"
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
        <p className="text-[11px] text-neutral-500">
          DoorTrack is fully offline-resilient. Active routes are always preserved on your device even if cell reception drops between houses.
        </p>
      </div>

      {/* EXPORT & DATA MANAGEMENT */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
          Data Export
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportCSV}
            disabled={sessions.length === 0}
            className="h-11 border border-neutral-300 hover:border-black rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            disabled={sessions.length === 0}
            className="h-11 border border-neutral-300 hover:border-black rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* IPHONE HOME SCREEN INSTRUCTIONS */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          Add to iPhone Home Screen
        </span>
        <ol className="text-xs text-neutral-600 space-y-1 list-decimal list-inside leading-relaxed pt-1">
          <li>Open this link in Safari on your iPhone</li>
          <li>Tap the <strong>Share</strong> icon (square with arrow)</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
          <li>Launch DoorTrack directly with full-screen native feel</li>
        </ol>
      </div>

      {/* RESET DATA */}
      <div className="pt-2">
        {confirmClear ? (
          <div className="bg-neutral-100 rounded-2xl p-4 text-center space-y-2">
            <span className="text-xs font-bold text-neutral-900 block">
              Delete all {sessions.length} sessions?
            </span>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await onClearData();
                  setConfirmClear(false);
                }}
                className="flex-1 py-2 bg-black text-white text-xs font-bold rounded-xl uppercase"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2 bg-white text-neutral-700 text-xs font-bold rounded-xl border border-neutral-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full py-2.5 text-xs font-bold text-neutral-400 hover:text-red-600 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset / Clear All Sessions</span>
          </button>
        )}
      </div>
    </div>
  );
}
