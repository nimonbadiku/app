"use client";

import React from "react";
import { DoorClosed, History, TrendingUp, Settings } from "lucide-react";
import { playTap, triggerHaptic } from "@/lib/audio";

interface BottomNavProps {
  activeTab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS";
  onChangeTab: (tab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS") => void;
  isSelling: boolean;
  soundEnabled?: boolean;
}

export function BottomNav({
  activeTab,
  onChangeTab,
  isSelling,
  soundEnabled = true,
}: BottomNavProps) {
  const items = [
    {
      id: "SELL" as const,
      label: "Sell",
      icon: DoorClosed,
      badge: isSelling,
    },
    {
      id: "HISTORY" as const,
      label: "History",
      icon: History,
      badge: false,
    },
    {
      id: "PROGRESS" as const,
      label: "Progress",
      icon: TrendingUp,
      badge: false,
    },
    {
      id: "SETTINGS" as const,
      label: "Settings",
      icon: Settings,
      badge: false,
    },
  ];

  const handleSelect = (id: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS") => {
    if (activeTab !== id) {
      playTap(soundEnabled);
      triggerHaptic("light");
      onChangeTab(id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#F2F2F7]/85 dark:bg-black/85 backdrop-blur-2xl border-t border-black/[0.06] dark:border-white/[0.1] pb-safe transition-colors">
      <div className="max-w-md mx-auto flex items-center h-[56px] px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              aria-label={item.label}
              className={`tap-spring flex-1 flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer select-none ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-[22px] h-[22px] transition-transform ${
                    isActive ? "stroke-[2.4] scale-105" : "stroke-[1.8]"
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-emerald-400"></span>
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium transition-all ${
                  isActive
                    ? "font-semibold text-black dark:text-white"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
