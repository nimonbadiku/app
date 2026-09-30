"use client";

import React from "react";
import { Settings, ArrowLeft } from "lucide-react";

interface HeaderProps {
  isSelling: boolean;
  activeTab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS";
  onTabChange: (tab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS") => void;
  onOpenSettings: () => void;
  experiment?: string;
}

export function Header({
  isSelling,
  activeTab,
  onTabChange,
  onOpenSettings,
  experiment,
}: HeaderProps) {
  const handleBack = () => {
    if (activeTab !== "SELL") {
      onTabChange("SELL");
    } else if (isSelling) {
      onTabChange("HISTORY");
    }
  };

  const showBack = activeTab !== "SELL" || isSelling;

  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-md px-5 pt-safe pb-1.5">
      <div className="flex items-center h-11 max-w-md mx-auto">
        {/* Left: back only when it does something */}
        <div className="w-9 flex items-center">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Back"
              className="p-1.5 -ml-1.5 rounded-full hover:bg-neutral-100 active:scale-90 transition-all text-neutral-900 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}
        </div>

        {/* Center: single brand line. No duplicate hero below. */}
        <div className="text-center flex-1 px-2 min-w-0">
          <h1 className="text-[13px] font-bold tracking-[0.18em] uppercase text-neutral-900 font-sans leading-none">
            Doortrack
          </h1>
          {isSelling && experiment && (
            <p className="text-xs text-neutral-500 truncate max-w-[200px] mx-auto leading-tight mt-0.5">
              {experiment}
            </p>
          )}
        </div>

        {/* Right: settings only when idle — bottom tab covers it otherwise */}
        <div className="w-9 flex justify-end">
          {!isSelling && activeTab === "SELL" && (
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="p-1.5 -mr-1.5 rounded-full hover:bg-neutral-100 active:scale-90 transition-all text-neutral-500 cursor-pointer"
            >
              <Settings className="w-5 h-5 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
