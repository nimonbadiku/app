"use client";

import React from "react";
import { DoorClosed, History, TrendingUp, Settings } from "lucide-react";

interface BottomNavProps {
  activeTab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS";
  onChangeTab: (tab: "SELL" | "HISTORY" | "PROGRESS" | "SETTINGS") => void;
  isSelling: boolean;
}

export function BottomNav({ activeTab, onChangeTab, isSelling }: BottomNavProps) {
  const items = [
    {
      id: "SELL" as const,
      label: "SELL",
      icon: DoorClosed,
      badge: isSelling,
    },
    {
      id: "HISTORY" as const,
      label: "HISTORY",
      icon: History,
      badge: false,
    },
    {
      id: "PROGRESS" as const,
      label: "PROGRESS",
      icon: TrendingUp,
      badge: false,
    },
    {
      id: "SETTINGS" as const,
      label: "SETTINGS",
      icon: Settings,
      badge: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-t border-neutral-200/70 pb-safe">
      <div className="max-w-md mx-auto flex items-center h-[60px] px-6">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              aria-label={item.label}
              className={`flex-1 flex items-center justify-center py-2 transition-colors relative cursor-pointer ${
                isActive ? "text-black" : "text-neutral-300"
              }`}
            >
              <div className="relative">
                <Icon className={`w-[22px] h-[22px] ${isActive ? "stroke-[2.2]" : "stroke-[1.7]"}`} />
                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-black"></span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
