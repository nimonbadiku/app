"use client";

import React, { useState } from "react";
import { UserSettingsConfig, SessionRecord } from "@/types";
import {
  Volume2,
  VolumeX,
  Smartphone,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Sparkles,
  DollarSign,
  Target,
  Check,
  Plus,
  X,
  Info,
} from "lucide-react";
import { playTap, playSuccess } from "@/lib/audio";

interface SettingsViewProps {
  settings: UserSettingsConfig;
  onSaveSettings: (settings: UserSettingsConfig) => Promise<void>;
  sessions: SessionRecord[];
  onClearData: () => Promise<void>;
  onSyncOffline: () => Promise<void>;
  offlinePendingCount: number;
  onGenerateDemoData?: () => void;
  onImportJSON?: (imported: SessionRecord[]) => void;
}

export function SettingsView({
  settings,
  onSaveSettings,
  sessions,
  onClearData,
  onSyncOffline,
  offlinePendingCount,
  onGenerateDemoData,
  onImportJSON,
}: SettingsViewProps) {
  const [earningsPerItem, setEarningsPerItem] = useState(
    settings.earningsPerItem.toString()
  );
  const [pricePerItem, setPricePerItem] = useState(
    settings.pricePerItem.toString()
  );
  const [currency, setCurrency] = useState(settings.currency);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [hapticsEnabled, setHapticsEnabled] = useState(settings.hapticsEnabled ?? true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(settings.theme || "light");
  const [defaultTargetDoors, setDefaultTargetDoors] = useState(
    (settings.defaultTargetDoors || 40).toString()
  );
  const [focusPresets, setFocusPresets] = useState<string[]>(
    settings.focusPresets || ["Direct Hook", "Problem First", "Friendly Neighbor", "Shorter Pitch"]
  );
  const [newPresetText, setNewPresetText] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const parsedEarnings = parseFloat(earningsPerItem) || 0;
  const parsedPrice = parseFloat(pricePerItem) || 0;
  const commissionPercent = parsedPrice > 0 ? Math.round((parsedEarnings / parsedPrice) * 100) : 0;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    playTap(soundEnabled);

    try {
      const updated: UserSettingsConfig = {
        earningsPerItem: Math.max(0, parseFloat(earningsPerItem) || 20),
        pricePerItem: Math.max(0, parseFloat(pricePerItem) || 50),
        currency: currency.trim() || "kr",
        soundEnabled,
        hapticsEnabled,
        theme,
        defaultTargetDoors: Math.max(1, parseInt(defaultTargetDoors) || 40),
        focusPresets,
      };

      await onSaveSettings(updated);
      playSuccess(soundEnabled);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPreset = () => {
    if (newPresetText.trim() && !focusPresets.includes(newPresetText.trim())) {
      const updated = [...focusPresets, newPresetText.trim()];
      setFocusPresets(updated);
      setNewPresetText("");
    }
  };

  const handleRemovePreset = (preset: string) => {
    setFocusPresets(focusPresets.filter((p) => p !== preset));
  };

  const handleExportJSON = () => {
    playTap(soundEnabled);
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `doortrack-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    playTap(soundEnabled);
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
      "Territory",
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
      `"${(s.territory || "").replace(/"/g, '""')}"`,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && onImportJSON) {
          onImportJSON(parsed);
          playSuccess(soundEnabled);
        }
      } catch (err) {
        console.error("Invalid JSON file:", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-2 pb-safe-nav select-none space-y-4">
      <h2 className="text-[17px] font-extrabold text-neutral-950 dark:text-white tracking-tight">
        Settings
      </h2>

      {/* 1. COMMISSION & PRICING CARD */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Commission & Pricing
        </p>

        {/* Commission per Item */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <label htmlFor="earnings-input" className="text-xs font-semibold text-neutral-900 dark:text-white block">
              Commission per Item
            </label>
            <span className="text-[11px] text-neutral-400">Your direct payout per sale</span>
          </div>
          <div className="relative w-28">
            <input
              id="earnings-input"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={earningsPerItem}
              onChange={(e) => setEarningsPerItem(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold font-mono text-right text-neutral-900 dark:text-white focus:outline-none"
              required
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-400">
              {currency}
            </span>
          </div>
        </div>

        {/* Retail Price per Item */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <label htmlFor="price-input" className="text-xs font-semibold text-neutral-900 dark:text-white block">
              Retail Price per Item
            </label>
            <span className="text-[11px] text-neutral-400">
              Customer price ({commissionPercent}% commission)
            </span>
          </div>
          <div className="relative w-28">
            <input
              id="price-input"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold font-mono text-right text-neutral-900 dark:text-white focus:outline-none"
              required
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-400">
              {currency}
            </span>
          </div>
        </div>

        {/* Currency Selector */}
        <div>
          <span className="text-xs font-semibold text-neutral-900 dark:text-white block mb-1.5">
            Currency
          </span>
          <div className="flex flex-wrap gap-1">
            {["kr", "DKK", "SEK", "$", "€", "£", "CHF"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  playTap(soundEnabled);
                  setCurrency(c);
                }}
                className={`tap-spring flex-1 min-w-[42px] h-8 text-xs font-bold font-mono rounded-xl transition-all cursor-pointer ${
                  currency === c
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-2xs"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={isSaving}
          className="tap-spring w-full h-11 bg-black text-white dark:bg-white dark:text-black rounded-2xl font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Saved Settings</span>
            </>
          ) : isSaving ? (
            "Saving..."
          ) : (
            "Save Changes"
          )}
        </button>
      </form>

      {/* 2. APPEARANCE & HAPTICS CARD */}
      <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Appearance & Feedback
        </p>

        {/* Theme Selector */}
        <div>
          <span className="text-xs font-semibold text-neutral-900 dark:text-white block mb-1.5">
            Color Theme
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "OLED Dark", icon: Moon },
                { id: "system", label: "System", icon: Laptop },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    playTap(soundEnabled);
                    setTheme(t.id);
                    onSaveSettings({ ...settings, theme: t.id });
                  }}
                  className={`tap-spring h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    theme === t.id
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Sound Feedback */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
              Audio Clicks & Chimes
            </span>
            <span className="text-[11px] text-neutral-400">
              Satisfying iOS mechanical feedback
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              playTap(next);
              onSaveSettings({ ...settings, soundEnabled: next });
            }}
            className={`tap-spring w-12 h-7 rounded-full p-0.5 transition-colors cursor-pointer ${
              soundEnabled ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white dark:bg-black shadow-md transition-transform ${
                soundEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Vibration Haptics */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
              Haptic Vibration
            </span>
            <span className="text-[11px] text-neutral-400">
              Physical tap vibrations on mobile
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !hapticsEnabled;
              setHapticsEnabled(next);
              onSaveSettings({ ...settings, hapticsEnabled: next });
            }}
            className={`tap-spring w-12 h-7 rounded-full p-0.5 transition-colors cursor-pointer ${
              hapticsEnabled ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white dark:bg-black shadow-md transition-transform ${
                hapticsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. ROUTE FOCUS PRESETS */}
      <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Pitch Focus Presets
        </p>

        <div className="flex flex-wrap gap-1.5">
          {focusPresets.map((preset) => (
            <span
              key={preset}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
            >
              <span>{preset}</span>
              <button
                type="button"
                onClick={() => handleRemovePreset(preset)}
                className="text-neutral-400 hover:text-black dark:hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Add new preset tag..."
            value={newPresetText}
            onChange={(e) => setNewPresetText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPreset();
              }
            }}
            className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddPreset}
            className="tap-spring px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold"
          >
            Add
          </button>
        </div>
      </div>

      {/* 4. DEMO DATA & DATA MANAGEMENT */}
      <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Data & Testing
        </p>

        {/* Generate Demo Routes button */}
        {onGenerateDemoData && (
          <button
            type="button"
            onClick={() => {
              playSuccess(soundEnabled);
              onGenerateDemoData();
            }}
            className="tap-spring w-full h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-black/[0.04] dark:border-white/[0.05]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Realistic Sample Routes</span>
          </button>
        )}

        {/* Export & Import Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportCSV}
            disabled={sessions.length === 0}
            className="tap-spring h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={sessions.length === 0}
            className="tap-spring h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Import JSON file */}
        {onImportJSON && (
          <label className="tap-spring w-full h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}

        {/* Offline Sync Status */}
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
          <span className="text-xs text-neutral-500">
            {offlinePendingCount > 0
              ? `${offlinePendingCount} pending cloud sync`
              : "All sessions synchronized"}
          </span>
          <button
            onClick={async () => {
              setIsSyncing(true);
              await onSyncOffline();
              setIsSyncing(false);
            }}
            disabled={isSyncing || offlinePendingCount === 0}
            className="text-xs font-bold text-neutral-900 dark:text-white disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* 5. IPHONE PWA INSTALL GUIDE */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#121214] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" /> Install as iPhone App
        </p>
        <ol className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 list-decimal list-inside">
          <li>Open this link in Safari on your iPhone</li>
          <li>Tap the <strong>Share</strong> button at bottom</li>
          <li>Tap <strong>Add to Home Screen</strong></li>
        </ol>
      </div>

      {/* 6. CLEAR ALL DATA */}
      <div className="pt-2">
        {confirmClear ? (
          <div className="p-4 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center space-y-2">
            <p className="text-xs font-bold text-red-700 dark:text-red-400">
              Clear all {sessions.length} routes?
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await onClearData();
                  setConfirmClear(false);
                }}
                className="tap-spring flex-1 h-9 bg-red-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="tap-spring flex-1 h-9 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="tap-spring w-full py-2 text-xs font-semibold text-neutral-400 hover:text-red-500 cursor-pointer"
          >
            Clear all saved routes
          </button>
        )}
      </div>
    </div>
  );
}
