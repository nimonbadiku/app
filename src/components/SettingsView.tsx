"use client";

import React, { useState } from "react";
import { UserSettingsConfig, SessionRecord } from "@/types";

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
    <div className="max-w-md mx-auto px-5 pt-3 pb-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        Settings
      </p>

      <form onSubmit={handleSave} className="mt-3 bg-white rounded-2xl border border-neutral-200/80 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="earnings-input" className="text-[13px] text-neutral-500">
            Earnings per item
          </label>
          <div className="relative w-32">
            <input
              id="earnings-input"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={earningsPerItem}
              onChange={(e) => setEarningsPerItem(e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-xl bg-neutral-50 text-[15px] font-semibold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-neutral-300"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
              {currency}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="price-input" className="text-[13px] text-neutral-500">
            Retail price per item
          </label>
          <div className="relative w-32">
            <input
              id="price-input"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-xl bg-neutral-50 text-[15px] font-semibold text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-neutral-300"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
              {currency}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[13px] text-neutral-500 mb-2">Currency</p>
          <div className="flex gap-1.5">
            {["kr", "DKK", "$", "€", "£"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`flex-1 h-9 text-[13px] font-semibold rounded-xl transition-colors cursor-pointer ${
                  currency === c
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-500"
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
          className="w-full h-12 bg-black text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-transform cursor-pointer"
        >
          {saveSuccess ? "Saved" : isSaving ? "Saving…" : "Save"}
        </button>
      </form>

      <div className="mt-3 bg-white rounded-2xl border border-neutral-200/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-neutral-500">
            {offlinePendingCount > 0
              ? `${offlinePendingCount} pending sync`
              : "All synced"}
          </p>
          <button
            onClick={async () => {
              setIsSyncing(true);
              await onSyncOffline();
              setIsSyncing(false);
            }}
            disabled={isSyncing || offlinePendingCount === 0}
            className="text-[13px] font-semibold text-neutral-900 disabled:text-neutral-300 cursor-pointer"
          >
            {isSyncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
        <p className="text-[11px] text-neutral-400 mt-1">
          Sessions stay on your iPhone even without reception.
        </p>
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-neutral-200/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Export
        </p>
        <div className="mt-2.5 flex gap-1.5">
          <button
            onClick={handleExportCSV}
            disabled={sessions.length === 0}
            className="flex-1 h-10 rounded-xl bg-neutral-100 text-[13px] font-semibold text-neutral-700 disabled:text-neutral-300 cursor-pointer"
          >
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={sessions.length === 0}
            className="flex-1 h-10 rounded-xl bg-neutral-100 text-[13px] font-semibold text-neutral-700 disabled:text-neutral-300 cursor-pointer"
          >
            JSON
          </button>
        </div>
      </div>

      <div className="mt-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Install on iPhone
        </p>
        <ol className="mt-1.5 text-[13px] text-neutral-500 space-y-0.5 list-decimal list-inside">
          <li>Open this page in Safari</li>
          <li>Tap Share, then Add to Home Screen</li>
        </ol>
      </div>

      <div className="mt-4">
        {confirmClear ? (
          <div className="bg-neutral-50 rounded-2xl p-4 text-center">
            <p className="text-[13px] font-semibold text-neutral-900">
              Delete all {sessions.length} sessions?
            </p>
            <div className="flex gap-1.5 mt-3">
              <button
                onClick={async () => {
                  await onClearData();
                  setConfirmClear(false);
                }}
                className="flex-1 h-10 bg-black text-white text-[13px] font-semibold rounded-xl cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 h-10 text-neutral-500 text-[13px] font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full text-[13px] font-medium text-neutral-300 py-2 cursor-pointer"
          >
            Clear all sessions
          </button>
        )}
      </div>
    </div>
  );
}
