"use client";

import React, { useState, useMemo } from "react";
import { SessionRecord, UserSettingsConfig } from "@/types";
import {
  formatDurationHuman,
  calculateHourlyRateNumber,
  calculateDoorsPerHour,
  formatDateCaps,
} from "@/lib/formatters";
import {
  TrendingUp,
  Award,
  Zap,
  Target,
  Flame,
  CheckCircle2,
  Trophy,
  BarChart2,
  Calendar,
} from "lucide-react";
import { playTap } from "@/lib/audio";

interface ProgressViewProps {
  sessions: SessionRecord[];
  settings: UserSettingsConfig;
}

type MetricType = "rate" | "doors_per_hour" | "yes_rate" | "total_earnings" | "items_sold";
type TimeframeType = "7_DAYS" | "30_DAYS" | "ALL";

export function ProgressView({ sessions, settings }: ProgressViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("rate");
  const [timeframe, setTimeframe] = useState<TimeframeType>("7_DAYS");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const soundOn = settings.soundEnabled ?? true;

  // Filter sessions by timeframe
  const filteredChronological = useMemo(() => {
    let list = [...sessions].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    const now = new Date();
    if (timeframe === "7_DAYS") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((s) => new Date(s.startedAt) >= oneWeekAgo);
      // If less than 2 sessions in last 7 days, fallback to last 7 chronological sessions
      if (list.length < 2 && sessions.length >= 2) {
        list = [...sessions]
          .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
          .slice(-7);
      }
    } else if (timeframe === "30_DAYS") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter((s) => new Date(s.startedAt) >= thirtyDaysAgo);
      if (list.length < 2 && sessions.length >= 2) {
        list = [...sessions]
          .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
          .slice(-30);
      }
    }

    return list;
  }, [sessions, timeframe]);

  // Overall totals
  const totalEarned = sessions.reduce((acc, s) => acc + s.earnings, 0);
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = totalSeconds / 3600;
  const totalDoors = sessions.reduce((acc, s) => acc + s.doors, 0);
  const totalItems = sessions.reduce((acc, s) => acc + s.itemsSold, 0);
  const totalYes = sessions.reduce((acc, s) => acc + s.yesCount, 0);
  const totalNo = sessions.reduce((acc, s) => acc + s.noCount, 0);

  const averageRate = totalHours > 0 ? Math.round(totalEarned / totalHours) : 0;
  const overallYesRate = totalDoors > 0 ? ((totalYes / totalDoors) * 100).toFixed(1) : "0";
  const overallContactRate = totalDoors > 0 ? (((totalYes + totalNo) / totalDoors) * 100).toFixed(1) : "0";
  const overallCloseRate = totalYes + totalNo > 0 ? ((totalYes / (totalYes + totalNo)) * 100).toFixed(1) : "0";

  // Records / Best Sessions
  const bestRateSession = [...sessions].sort(
    (a, b) =>
      calculateHourlyRateNumber(b.earnings, b.durationSeconds) -
      calculateHourlyRateNumber(a.earnings, a.durationSeconds)
  )[0];

  const mostDoorsSession = [...sessions].sort((a, b) => b.doors - a.doors)[0];
  const mostSalesSession = [...sessions].sort((a, b) => b.yesCount - a.yesCount)[0];

  // Week-over-week comparisons
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
  const chartPoints = filteredChronological.map((s, idx) => {
    const h = s.durationSeconds > 0 ? s.durationSeconds / 3600 : 0;
    let val = 0;
    if (selectedMetric === "rate") {
      val = calculateHourlyRateNumber(s.earnings, s.durationSeconds);
    } else if (selectedMetric === "doors_per_hour") {
      val = calculateDoorsPerHour(s.doors, s.durationSeconds);
    } else if (selectedMetric === "yes_rate") {
      val = s.doors > 0 ? parseFloat(((s.yesCount / s.doors) * 100).toFixed(1)) : 0;
    } else if (selectedMetric === "total_earnings") {
      val = Math.round(s.earnings);
    } else if (selectedMetric === "items_sold") {
      val = s.itemsSold;
    }

    return {
      index: idx,
      session: s,
      value: val,
      dateLabel: formatDateCaps(s.startedAt),
    };
  });

  const metricLabels: Record<MetricType, { title: string; unit: string }> = {
    rate: { title: "Hourly Rate", unit: ` ${settings.currency}/h` },
    doors_per_hour: { title: "Doors / Hour", unit: " doors/h" },
    yes_rate: { title: "Yes Conversion", unit: "%" },
    total_earnings: { title: "Session Earnings", unit: ` ${settings.currency}` },
    items_sold: { title: "Items Sold", unit: " items" },
  };

  const maxVal = Math.max(...chartPoints.map((p) => p.value), 10);
  const avgVal =
    chartPoints.length > 0
      ? Math.round(chartPoints.reduce((acc, p) => acc + p.value, 0) / chartPoints.length)
      : 0;

  const chartHeight = 160;
  const chartWidth = 330;
  const paddingX = 20;
  const paddingY = 24;

  // Milestone Achievements Data
  const achievements = [
    {
      id: "first_knock",
      title: "First Route",
      desc: "Complete your first sales session",
      icon: Target,
      unlocked: sessions.length >= 1,
      progress: Math.min(1, sessions.length / 1),
      label: `${Math.min(1, sessions.length)}/1`,
    },
    {
      id: "century_club",
      title: "Century Club",
      desc: "Knock 100 total doors",
      icon: Trophy,
      unlocked: totalDoors >= 100,
      progress: Math.min(1, totalDoors / 100),
      label: `${Math.min(100, totalDoors)}/100`,
    },
    {
      id: "speed_demon",
      title: "Speed Demon",
      desc: "Hit 30+ doors/hour in a route",
      icon: Zap,
      unlocked: sessions.some((s) => calculateDoorsPerHour(s.doors, s.durationSeconds) >= 30),
      progress: sessions.some((s) => calculateDoorsPerHour(s.doors, s.durationSeconds) >= 30) ? 1 : 0.6,
      label: "30 doors/h",
    },
    {
      id: "closer_ace",
      title: "Closing Ace",
      desc: "Achieve 15%+ Yes rate on a route",
      icon: Award,
      unlocked: sessions.some((s) => s.doors >= 15 && (s.yesCount / s.doors) >= 0.15),
      progress: sessions.some((s) => s.doors >= 15 && (s.yesCount / s.doors) >= 0.15) ? 1 : 0.7,
      label: "15% Yes",
    },
    {
      id: "high_roller",
      title: "High Roller",
      desc: "Earn 500+ in a single route",
      icon: Flame,
      unlocked: sessions.some((s) => s.earnings >= 500),
      progress: Math.min(1, (bestRateSession?.earnings || 0) / 500),
      label: `500 ${settings.currency}`,
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 pt-2 pb-safe-nav select-none space-y-3.5">
      <h2 className="text-[17px] font-extrabold text-neutral-950 dark:text-white tracking-tight">
        Performance & Trends
      </h2>

      {sessions.length === 0 ? (
        <div className="text-center py-12 px-5 bg-white dark:bg-[#121214] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <BarChart2 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-[16px] font-bold text-neutral-950 dark:text-white">
            No Progress Data Yet
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-[240px] mx-auto">
            Finish your first session to unlock interactive performance charts and milestone badges.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Top All-Time Stats Card */}
          <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[28px] font-black tabular-nums tracking-tight font-mono text-neutral-950 dark:text-white">
                {totalEarned}{" "}
                <span className="text-base font-bold text-neutral-400 font-sans">
                  {settings.currency}
                </span>
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {averageRate} {settings.currency}/h avg
              </span>
            </div>
            <p className="text-xs text-neutral-400 tabular-nums">
              {sessions.length} routes • {formatDurationHuman(totalSeconds)} • {totalDoors} doors • {totalYes} sales ({totalItems} items)
            </p>
          </div>

          {/* INTERACTIVE TREND CHART */}
          <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
            {/* Metric Selector Pills */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "rate", label: `${settings.currency}/h` },
                  { id: "doors_per_hour", label: "Doors/h" },
                  { id: "yes_rate", label: "Yes %" },
                  { id: "total_earnings", label: "Earnings" },
                  { id: "items_sold", label: "Items" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    playTap(soundOn);
                    setSelectedMetric(m.id);
                  }}
                  className={`tap-spring flex-1 py-1 px-2 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedMetric === m.id
                      ? "bg-white text-black dark:bg-black dark:text-white shadow-xs"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Timeframe Toggle */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-neutral-900 dark:text-white text-xs">
                {metricLabels[selectedMetric].title}
              </span>
              <div className="flex gap-1">
                {(
                  [
                    { id: "7_DAYS", label: "7 Routes" },
                    { id: "30_DAYS", label: "30 Days" },
                    { id: "ALL", label: "All" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      playTap(soundOn);
                      setTimeframe(t.id);
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                      timeframe === t.id
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Canvas / SVG */}
            {chartPoints.length < 2 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                Log at least 2 sessions to see trend graph.
              </div>
            ) : (
              <div className="relative pt-2">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-40 overflow-visible"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const step =
                      (chartWidth - paddingX * 2) / (chartPoints.length - 1 || 1);

                    const coords = chartPoints.map((pt, i) => {
                      const x = paddingX + i * step;
                      const ratio = pt.value / (maxVal || 1);
                      const y =
                        chartHeight -
                        paddingY -
                        ratio * (chartHeight - paddingY * 2);
                      return { x, y, pt };
                    });

                    // Build smooth curve path
                    const pathData = coords.reduce((acc, curr, i, arr) => {
                      if (i === 0) return `M ${curr.x},${curr.y}`;
                      const prev = arr[i - 1];
                      const cp1x = prev.x + (curr.x - prev.x) / 2;
                      const cp1y = prev.y;
                      const cp2x = prev.x + (curr.x - prev.x) / 2;
                      const cp2y = curr.y;
                      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
                    }, "");

                    const areaData = `${pathData} L ${coords[coords.length - 1].x},${
                      chartHeight - paddingY
                    } L ${coords[0].x},${chartHeight - paddingY} Z`;

                    // Average line
                    const avgY =
                      chartHeight -
                      paddingY -
                      (avgVal / (maxVal || 1)) * (chartHeight - paddingY * 2);

                    return (
                      <>
                        {/* Avg dashed line */}
                        <line
                          x1={paddingX}
                          y1={avgY}
                          x2={chartWidth - paddingX}
                          y2={avgY}
                          stroke="#A1A1AA"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                          opacity="0.5"
                        />

                        {/* Area Fill */}
                        <path
                          d={areaData}
                          fill="url(#chartGradient)"
                          className="text-black dark:text-white"
                        />

                        {/* Main Stroke Path */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black dark:text-white"
                        />

                        {/* Data Points */}
                        {coords.map((c, i) => (
                          <g key={i}>
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r={hoveredIndex === i ? 6 : 3.5}
                              className="fill-white dark:fill-black stroke-black dark:stroke-white stroke-[2.5] cursor-pointer transition-all"
                              onClick={() => {
                                playTap(soundOn);
                                setHoveredIndex(hoveredIndex === i ? null : i);
                              }}
                            />
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Scrubber Tooltip */}
                {hoveredIndex !== null && chartPoints[hoveredIndex] ? (
                  <div className="mt-2 text-center py-1.5 px-3 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono shadow-md animate-in fade-in">
                    {chartPoints[hoveredIndex].value}
                    {metricLabels[selectedMetric].unit} •{" "}
                    {chartPoints[hoveredIndex].dateLabel}
                  </div>
                ) : (
                  <p className="mt-1 text-center text-[10px] text-neutral-400 font-medium">
                    Tap any point on chart to inspect route value • Avg: {avgVal}
                    {metricLabels[selectedMetric].unit}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SALES CONVERSION FUNNEL CARD */}
          <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Sales Conversion Funnel
            </p>

            <div className="space-y-2 text-xs">
              {/* Funnel Stage 1: Doors */}
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex justify-between font-bold text-neutral-900 dark:text-white mb-1">
                  <span>1. Doors Knocked</span>
                  <span className="font-mono">{totalDoors}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <div className="h-full bg-black dark:bg-white rounded-full w-full" />
                </div>
              </div>

              {/* Funnel Stage 2: Contacts */}
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex justify-between font-bold text-neutral-900 dark:text-white mb-1">
                  <span>2. Answered Doors ({overallContactRate}%)</span>
                  <span className="font-mono">{totalYes + totalNo}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <div
                    className="h-full bg-neutral-800 dark:bg-neutral-200 rounded-full"
                    style={{ width: `${Math.min(100, parseFloat(overallContactRate) || 0)}%` }}
                  />
                </div>
              </div>

              {/* Funnel Stage 3: Closed Sales */}
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  <span>3. Pitches Closed ({overallCloseRate}% of contacts)</span>
                  <span className="font-mono">{totalYes} sales</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, parseFloat(overallYesRate) || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WEEK-OVER-WEEK COMPARISON */}
          <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                This Week vs Last Week
              </span>
              {weekRateDiff !== null && (
                <span
                  className={`text-xs font-bold font-mono ${
                    weekRateDiff >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500"
                  }`}
                >
                  {weekRateDiff >= 0 ? `+${weekRateDiff}%` : `${weekRateDiff}%`} pace
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-[22px] font-black font-mono tabular-nums text-neutral-950 dark:text-white">
                {cwEarned}{" "}
                <span className="text-xs font-bold text-neutral-400 font-sans">
                  {settings.currency}
                </span>
              </span>
              <span className="text-xs font-bold text-neutral-500 font-mono">
                {cwRate} {settings.currency}/h
              </span>
            </div>

            <p className="text-xs text-neutral-400 mt-1 tabular-nums">
              {currentWeekSessions.length} routes • {formatDurationHuman(cwSeconds)} • {cwDoors} doors
            </p>
          </div>

          {/* ACHIEVEMENTS / MILESTONE BADGES SHELF */}
          <div className="bg-white dark:bg-[#121214] rounded-3xl p-4 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Milestones & Badges
              </p>
              <span className="text-xs font-bold font-mono text-neutral-500">
                {achievements.filter((a) => a.unlocked).length}/{achievements.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      ach.unlocked
                        ? "bg-neutral-50 dark:bg-neutral-900 border-black/[0.08] dark:border-white/[0.1]"
                        : "bg-neutral-100/50 dark:bg-neutral-900/40 border-transparent opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          ach.unlocked
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-950 dark:text-white">
                          {ach.title}
                        </p>
                        <p className="text-[10px] text-neutral-400">{ach.desc}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {ach.unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-400 font-mono">
                          {ach.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
