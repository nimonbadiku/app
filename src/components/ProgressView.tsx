"use client";

import React, { useState } from "react";
import { SessionRecord, UserSettingsConfig } from "@/types";
import {
  formatDurationHuman,
  calculateHourlyRateNumber,
  formatDateCaps,
} from "@/lib/formatters";
import {
  TrendingUp,
  Award,
  Calendar,
  Zap,
  BarChart3,
  Flame,
} from "lucide-react";

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
    <div className="max-w-md mx-auto px-5 pt-4 pb-28 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950">
          Progress & Performance
        </h2>
        <p className="text-xs text-neutral-500 font-medium">
          &ldquo;Am I getting better?&rdquo;
        </p>
      </div>

      {/* ALL TIME TOTALS */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-3">
          All-Time Total
        </span>

        <div className="flex items-baseline justify-between border-b border-neutral-100 pb-4 mb-4">
          <div>
            <span className="text-4xl font-black text-neutral-950 font-sans tracking-tight">
              {totalEarned}{" "}
              <span className="text-xl font-extrabold text-neutral-800">
                {settings.currency}
              </span>
            </span>
            <span className="block text-xs font-semibold text-neutral-500 mt-0.5">
              Across {formatDurationHuman(totalSeconds)} selling
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-neutral-900 block">
              {averageRate}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">
              Avg {settings.currency} / hour
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-neutral-50 rounded-xl">
            <span className="text-lg font-black text-neutral-950 block">{totalDoors}</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Total Doors</span>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded-xl">
            <span className="text-lg font-black text-neutral-950 block">{totalItems}</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Items Sold</span>
          </div>
          <div className="p-2.5 bg-neutral-50 rounded-xl">
            <span className="text-lg font-black text-neutral-950 block">{overallYesRate}%</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Overall Yes%</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE TREND CHART */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Performance Trend
          </span>
          <span className="text-[11px] font-bold text-neutral-950">
            {metricLabels[selectedMetric].title}
          </span>
        </div>

        {/* Metric Selector Pills */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl mb-4">
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
              className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                selectedMetric === m.id
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* SVG Chart */}
        {chartPoints.length < 2 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            Complete at least 2 sessions to see performance trends.
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              {/* Subtle grid lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                stroke="#E5E5E5"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={chartHeight / 2}
                x2={chartWidth - paddingX}
                y2={chartHeight / 2}
                stroke="#E5E5E5"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="#E5E5E5"
              />

              {/* Connecting line */}
              {(() => {
                const step =
                  (chartWidth - paddingX * 2) / (chartPoints.length - 1 || 1);
                const pointsSvg = chartPoints.map((p, i) => {
                  const x = paddingX + i * step;
                  const ratio = p.value / (maxVal || 1);
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
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsSvg.join(" ")}
                    />
                    {chartPoints.map((p, i) => {
                      const x = paddingX + i * step;
                      const ratio = p.value / (maxVal || 1);
                      const y =
                        chartHeight -
                        paddingY -
                        ratio * (chartHeight - paddingY * 2);
                      const isHovered = hoveredIndex === i;

                      return (
                        <g key={i}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 6 : 4}
                            fill={isHovered ? "#000000" : "#FFFFFF"}
                            stroke="#000000"
                            strokeWidth={isHovered ? 3 : 2}
                            className="cursor-pointer transition-all"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onClick={() => setHoveredIndex(i)}
                          />
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Active Point Tooltip */}
            {hoveredIndex !== null && chartPoints[hoveredIndex] && (
              <div className="mt-2 p-2 bg-neutral-900 text-white rounded-xl text-center text-xs animate-in fade-in duration-100">
                <span className="font-black text-sm">
                  {chartPoints[hoveredIndex].value}
                  {metricLabels[selectedMetric].unit}
                </span>
                <span className="block text-[10px] text-neutral-400">
                  {chartPoints[hoveredIndex].dateLabel} •{" "}
                  {chartPoints[hoveredIndex].session.doors} doors
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* THIS WEEK SUMMARY (Requirement #15) */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            This Week
          </span>
          {weekRateDiff !== null && (
            <span
              className={`text-[11px] font-black ${
                weekRateDiff >= 0 ? "text-neutral-950" : "text-neutral-500"
              }`}
            >
              {weekRateDiff >= 0 ? `+${weekRateDiff}%` : `${weekRateDiff}%`} vs last week
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-black text-neutral-950">
            {cwEarned} {settings.currency}
          </span>
          <span className="text-xs font-bold text-neutral-700">
            {cwRate} {settings.currency} / hour
          </span>
        </div>

        <div className="text-xs text-neutral-600 flex items-center justify-between border-t border-neutral-100 pt-3">
          <span>{currentWeekSessions.length} sessions</span>
          <span>•</span>
          <span>{formatDurationHuman(cwSeconds)}</span>
          <span>•</span>
          <span>{cwDoors} doors</span>
          <span>•</span>
          <span>{cwYes} yes</span>
          <span>•</span>
          <span>{cwItems} items</span>
        </div>
      </div>

      {/* FACTUAL HISTORICAL RECORDS (Requirement #16) */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 flex items-center gap-1.5 mb-3">
            <Award className="w-3.5 h-3.5" />
            Historical Bests
          </span>

          <div className="space-y-3 text-xs">
            {/* Best DKK/hour */}
            {bestRateSession && (
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                    Best Hourly Rate
                  </span>
                  <span className="font-black text-base text-neutral-950">
                    {calculateHourlyRateNumber(
                      bestRateSession.earnings,
                      bestRateSession.durationSeconds
                    )}{" "}
                    {bestRateSession.currency} / hour
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {formatDateCaps(bestRateSession.startedAt)}
                </span>
              </div>
            )}

            {/* Most Doors */}
            {mostDoorsSession && (
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                    Most Doors in Session
                  </span>
                  <span className="font-black text-base text-neutral-950">
                    {mostDoorsSession.doors} doors
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {formatDateCaps(mostDoorsSession.startedAt)}
                </span>
              </div>
            )}

            {/* Most Items */}
            {mostItemsSession && (
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                    Most Items Sold
                  </span>
                  <span className="font-black text-base text-neutral-950">
                    {mostItemsSession.itemsSold} items
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {formatDateCaps(mostItemsSession.startedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
