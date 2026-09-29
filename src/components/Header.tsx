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

  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA] border-b border-transparent px-6 pt-safe pb-2">
      <div className="flex items-center justify-between h-12 max-w-md mx-auto">
        {/* Left Back Arrow - matching reference image */}
        <div className="w-10 flex items-center">
          {activeTab !== "SELL" ? (
            <button
              onClick={handleBack}
              aria-label="Back to sell"
              className="p-1 -ml-2 rounded-full hover:bg-neutral-100 active:scale-90 transition-all text-neutral-900 cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </button>
          ) : isSelling ? (
            <button
              onClick={() => onTabChange("HISTORY")}
              aria-label="View history"
              className="p-1 -ml-2 rounded-full hover:bg-neutral-100 active:scale-90 transition-all text-neutral-900 cursor-pointer"
              title="View History while session continues"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Center Title - Bold uppercase DoorTrack */}
        <div className="text-center flex-1 px-2">
          <h1 className="text-base font-black tracking-wider uppercase text-neutral-950 font-sans">
            DOORTRACK
          </h1>
          {isSelling && experiment && (
            <p className="text-[13px] text-neutral-500 font-handwriting truncate max-w-[190px] mx-auto leading-none">
              &ldquo;{experiment}&rdquo;
            </p>
          )}
        </div>

        {/* Right Settings Gear - matching reference image */}
        <div className="w-10 flex justify-end">
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-1 -mr-2 rounded-full hover:bg-neutral-100 active:scale-90 transition-all text-neutral-900 cursor-pointer"
          >
            <Settings className="w-6 h-6 stroke-[1.8]" />
          </button>
        </div>
      </div>
    </header>
  );
}
