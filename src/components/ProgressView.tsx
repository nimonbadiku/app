"use client";

import React, { useState } from "react";
import { SessionRecord, UserSettingsConfig } from "@/types";
import {
  formatDurationHuman,
  calculateHourlyRateNumber,
  formatDateCaps,
} from "@/lib/formatters";

interface ProgressViewProps {
  sessions: SessionRecord[];
  settings: UserSettingsConfig;
}

type MetricType = "rate" | "doors_per_hour" | "yes_rate" | "items_per_hour";

export function ProgressView({ sessions, settings }: ProgressViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("rate");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Chronological order for trend charts (oldest to newest)
  const chronological = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  // Overall totals
  const totalEarned = sessions.reduce((acc, s) => acc + s.earnings, 0);
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = totalSeconds / 3600;
  const totalDoors = sessions.reduce((acc, s) => acc + s.doors, 0);
  const totalItems = sessions.reduce((acc, s) => acc + s.itemsSold, 0);
  const totalYes = sessions.reduce((acc, s) => acc + s.yesCount, 0);

  const averageRate =
    totalHours > 0 ? Math.round(totalEarned / totalHours) : 0;
  const overallYesRate =
    totalDoors > 0 ? ((totalYes / totalDoors) * 100).toFixed(1) : "0";

  // Records / Best Sessions
  const bestRateSession = [...sessions].sort(
    (a, b) =>
      calculateHourlyRateNumber(b.earnings, b.durationSeconds) -
      calculateHourlyRateNumber(a.earnings, a.durationSeconds)
  )[0];

  const mostDoorsSession = [...sessions].sort((a, b) => b.doors - a.doors)[0];
  const mostItemsSession = [...sessions].sort((a, b) => b.itemsSold - a.itemsSold)[0];

  // Weekly calculations
  const now = new Date();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const startOfCurrentWeek = new Date(now.getTime() - oneWeekMs);
  const startOfPrevWeek = new Date(now.getTime() - 2 * oneWeekMs);

  const currentWeekSessions = sessions.filter(
    (s) => new Date(s.startedAt) >= startOfCurrentWeek
  );
  const prevWeekSessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    return d >= startOfPrevWeek && d < startOfCurrentWeek;
  });

  const cwSeconds = currentWeekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const cwHours = cwSeconds / 3600;
  const cwEarned = currentWeekSessions.reduce((acc, s) => acc + s.earnings, 0);
  const cwDoors = currentWeekSessions.reduce((acc, s) => acc + s.doors, 0);
  const cwYes = currentWeekSessions.reduce((acc, s) => acc + s.yesCount, 0);
  const cwItems = currentWeekSessions.reduce((acc, s) => acc + s.itemsSold, 0);
  const cwRate = cwHours > 0 ? Math.round(cwEarned / cwHours) : 0;

  const pwSeconds = prevWeekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const pwHours = pwSeconds / 3600;
  const pwEarned = prevWeekSessions.reduce((acc, s) => acc + s.earnings, 0);
  const pwRate = pwHours > 0 ? Math.round(pwEarned / pwHours) : 0;

  let weekRateDiff: number | null = null;
  if (pwRate > 0 && cwRate > 0) {
    weekRateDiff = Math.round(((cwRate - pwRate) / pwRate) * 100);
  }

  // Chart data extraction
  const chartPoints = chronological.map((s, idx) => {
    const h = s.durationSeconds > 0 ? s.durationSeconds / 3600 : 0;
    let val = 0;
    if (selectedMetric === "rate") {
      val = calculateHourlyRateNumber(s.earnings, s.durationSeconds);
    } else if (selectedMetric === "doors_per_hour") {
      val = h > 0 ? Math.round(s.doors / h) : 0;
    } else if (selectedMetric === "yes_rate") {
      val = s.doors > 0 ? parseFloat(((s.yesCount / s.doors) * 100).toFixed(1)) : 0;
    } else if (selectedMetric === "items_per_hour") {
      val = h > 0 ? parseFloat((s.itemsSold / h).toFixed(1)) : 0;
    }

    return {
      index: idx,
      session: s,
      value: val,
      dateLabel: formatDateCaps(s.startedAt),
    };
  });

  const metricLabels: Record<MetricType, { title: string; unit: string }> = {
    rate: { title: `${settings.currency} / Hour`, unit: ` ${settings.currency}/h` },
    doors_per_hour: { title: "Doors / Hour", unit: " doors/h" },
    yes_rate: { title: "Yes Rate", unit: "%" },
    items_per_hour: { title: "Items / Hour", unit: " items/h" },
  };

  const maxVal = Math.max(...chartPoints.map((p) => p.value), 10);
  const chartHeight = 150;
  const chartWidth = 320;
  const paddingX = 24;
  const paddingY = 20;

  return (
    <div className="max-w-md mx-auto px-5 pt-3 pb-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        Progress
      </p>

      {sessions.length === 0 ? (
        <div className="mt-3 text-center py-14 px-4 bg-white rounded-2xl border border-neutral-200/80">
          <p className="text-[15px] font-semibold text-neutral-900">No data yet</p>
          <p className="text-[13px] text-neutral-400 mt-1">
            Finish your first session to see totals and trends.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[26px] font-bold tabular-nums tracking-tight text-neutral-950">
                {totalEarned} <span className="text-base font-semibold text-neutral-400">{settings.currency}</span>
              </span>
              <span className="text-[13px] font-medium text-neutral-400 tabular-nums">
                {averageRate} {settings.currency}/h avg
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 tabular-nums">
              {sessions.length} sessions · {formatDurationHuman(totalSeconds)} · {totalDoors} doors · {totalItems} items · {overallYesRate}% yes
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4">
            <div className="flex gap-1 p-1 bg-neutral-100 rounded-full mb-3">
              {(
                [
                  { id: "rate", label: `${settings.currency}/h` },
                  { id: "doors_per_hour", label: "Doors/h" },
                  { id: "yes_rate", label: "Yes %" },
                  { id: "items_per_hour", label: "Items/h" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m.id)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                    selectedMetric === m.id
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {chartPoints.length < 2 ? (
              <div className="py-10 text-center text-[13px] text-neutral-400">
                Log one more session to see your trend.
              </div>
            ) : (
              <div>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-36 overflow-visible"
                >
                  {(() => {
                    const step =
                      (chartWidth - paddingX * 2) / (chartPoints.length - 1 || 1);
                    const pointsSvg = chartPoints.map((pt, i) => {
                      const x = paddingX + i * step;
                      const ratio = pt.value / (maxVal || 1);
                      const y =
                        chartHeight -
                        paddingY -
                        ratio * (chartHeight - paddingY * 2);
                      return `${x},${y}`;
                    });

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsSvg.join(" ")}
                        />
                        {chartPoints.map((pt, i) => {
                          const x = paddingX + i * step;
                          const ratio = pt.value / (maxVal || 1);
                          const y =
                            chartHeight -
                            paddingY -
                            ratio * (chartHeight - paddingY * 2);
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r={hoveredIndex === i ? 4.5 : 3}
                              fill={hoveredIndex === i ? "#000000" : "#FFFFFF"}
                              stroke="#000000"
                              strokeWidth={2}
                              className="cursor-pointer"
                              onClick={() => setHoveredIndex(hoveredIndex === i ? null : i)}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {hoveredIndex !== null && chartPoints[hoveredIndex] && (
                  <p className="mt-1 text-center text-xs text-neutral-500 tabular-nums">
                    {chartPoints[hoveredIndex].value}
                    {metricLabels[selectedMetric].unit} ·{" "}
                    {chartPoints[hoveredIndex].dateLabel}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                This week
              </span>
              {weekRateDiff !== null && (
                <span className="text-[11px] font-semibold text-neutral-500 tabular-nums">
                  {weekRateDiff >= 0 ? `+${weekRateDiff}%` : `${weekRateDiff}%`} vs last week
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-[22px] font-bold tabular-nums text-neutral-950">
                {cwEarned} <span className="text-sm font-semibold text-neutral-400">{settings.currency}</span>
              </span>
              <span className="text-[13px] font-medium text-neutral-400 tabular-nums">
                {cwRate} {settings.currency}/h
              </span>
            </div>

            <p className="text-xs text-neutral-400 mt-1 tabular-nums">
              {currentWeekSessions.length} sessions · {formatDurationHuman(cwSeconds)} · {cwDoors} doors · {cwYes} yes · {cwItems} items
            </p>
          </div>

          {bestRateSession && (
            <p className="text-center text-xs text-neutral-400 tabular-nums">
              Best: {calculateHourlyRateNumber(bestRateSession.earnings, bestRateSession.durationSeconds)} {bestRateSession.currency}/h · {mostDoorsSession?.doors ?? 0} doors · {mostItemsSession?.itemsSold ?? 0} items
            </p>
          )}
        </div>
      )}
    </div>
  );
}
