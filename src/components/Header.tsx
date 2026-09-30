"use client";

import React from "react";
import { Settings, ArrowLeft, Volume2, VolumeX, Moon, Sun } from "lucide-react";
import { playTap, triggerHaptic } from "@/lib/audio";

interface HeaderProps {
  isSelling: boolean;
  activeTab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS";
  onTabChange: (tab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS") => void;
  onOpenSettings: () => void;
  experiment?: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  theme?: "light" | "dark" | "system";
  onToggleTheme?: () => void;
}

export function Header({
  isSelling,
  activeTab,
  onTabChange,
  onOpenSettings,
  experiment,
  soundEnabled = true,
  onToggleSound,
  theme = "light",
  onToggleTheme,
}: HeaderProps) {
  const handleBack = () => {
    playTap(soundEnabled);
    triggerHaptic("light");
    if (activeTab !== "SELL") {
      onTabChange("SELL");
    }
  };

  const showBack = activeTab !== "SELL";

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-b border-black/[0.05] dark:border-white/[0.08] px-4 pt-safe transition-colors">
      <div className="flex items-center justify-between h-13 max-w-md mx-auto">
        {/* Left: Back button or brand badge */}
        <div className="w-10 flex items-center">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label="Back"
              className="tap-spring p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          ) : (
            <div className="w-6 h-6 rounded-xl bg-black dark:bg-white flex items-center justify-center shadow-xs">
              <span className="w-2 h-2 rounded-sm bg-white dark:bg-black"></span>
            </div>
          )}
        </div>

        {/* Center: Branding & Focus tag */}
        <div className="text-center flex-1 px-2 min-w-0">
          <h1 className="text-[13px] font-extrabold tracking-[0.22em] uppercase text-neutral-950 dark:text-white font-sans leading-none">
            DoorTrack
          </h1>
          {isSelling && experiment ? (
            <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 truncate max-w-[200px] mx-auto leading-tight mt-0.5">
              {experiment}
            </p>
          ) : null}
        </div>

        {/* Right: Sound toggle / Settings / Theme */}
        <div className="w-10 flex items-center justify-end gap-1">
          {onToggleTheme && (
            <button
              onClick={() => {
                playTap(soundEnabled);
                triggerHaptic("light");
                onToggleTheme();
              }}
              aria-label="Toggle dark mode"
              className="tap-spring p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 stroke-[2]" />
              ) : (
                <Moon className="w-4 h-4 stroke-[2]" />
              )}
            </button>
          )}

          {!isSelling && activeTab === "SELL" ? (
            <button
              onClick={() => {
                playTap(soundEnabled);
                triggerHaptic("light");
                onOpenSettings();
              }}
              aria-label="Settings"
              className="tap-spring p-1.5 -mr-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <Settings className="w-4 h-4 stroke-[2]" />
            </button>
          ) : onToggleSound ? (
            <button
              onClick={() => {
                triggerHaptic("light");
                onToggleSound();
              }}
              aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
              className="tap-spring p-1.5 -mr-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 stroke-[2]" />
              ) : (
                <VolumeX className="w-4 h-4 stroke-[2] opacity-40" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
