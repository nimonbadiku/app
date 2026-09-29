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
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-t border-neutral-200/80 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? "text-black" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-wider uppercase mt-1 ${
                  isActive ? "font-bold text-black" : "font-medium text-neutral-400"
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
