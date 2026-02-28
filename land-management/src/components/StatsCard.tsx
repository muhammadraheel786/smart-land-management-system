"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendUpLabel?: string;
  trendDownLabel?: string;
  color?: "green" | "blue" | "yellow" | "red";
  href?: string;
}

const colorStyles: Record<string, { card: string; icon: string; value: string; trendUp: string; trendDown: string }> = {
  green: {
    card: "border-green-500/25 from-green-500/10 to-emerald-600/5",
    icon: "text-green-400",
    value: "text-green-400",
    trendUp: "text-green-400",
    trendDown: "text-red-400",
  },
  blue: {
    card: "border-blue-500/25 from-blue-500/10 to-cyan-600/5",
    icon: "text-blue-400",
    value: "text-blue-400",
    trendUp: "text-green-400",
    trendDown: "text-red-400",
  },
  yellow: {
    card: "border-amber-500/25 from-amber-500/10 to-yellow-600/5",
    icon: "text-amber-400",
    value: "text-amber-400",
    trendUp: "text-green-400",
    trendDown: "text-red-400",
  },
  red: {
    card: "border-red-500/25 from-red-500/10 to-rose-600/5",
    icon: "text-red-400",
    value: "text-red-400",
    trendUp: "text-green-400",
    trendDown: "text-red-400",
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUpLabel,
  trendDownLabel,
  color = "green",
  href,
}: StatsCardProps) {
  const s = colorStyles[color] || colorStyles.green;

  const card = (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-theme bg-theme-card backdrop-blur-sm
        p-5 h-full min-h-[140px] flex flex-col
        shadow-lg transition-all duration-200
        ${s.card}
        ${href ? "cursor-pointer hover:border-opacity-60 hover:shadow-lg hover:-translate-y-0.5" : ""}
      `}
    >
      {/* Top row: title (left) + icon (top right) */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-theme-muted leading-tight">
          {title}
        </span>
        <span className={`flex-shrink-0 ${s.icon}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>

      {/* Primary value */}
      <p className={`mt-3 text-2xl font-bold tracking-tight ${s.value}`}>
        {value}
      </p>

      {/* Subtitle and/or trend — accent color for subtitle, trend color for trend */}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
        {subtitle && <span className={`opacity-90 ${s.value}`}>{subtitle}</span>}
        {trend && (
          <span
            className={
              trend === "up" ? s.trendUp : trend === "down" ? s.trendDown : "text-theme-muted"
            }
          >
            {trend === "up"
              ? trendUpLabel ?? "↑ Improving"
              : trend === "down"
              ? trendDownLabel ?? "↓ Needs attention"
              : "—"}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-2xl">
        {card}
      </Link>
    );
  }
  return <div className="h-full min-w-0">{card}</div>;
}
