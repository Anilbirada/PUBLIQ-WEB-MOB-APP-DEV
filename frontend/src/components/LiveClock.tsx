"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

interface LiveClockProps {
  variant?: "badge" | "header" | "digital" | "minimal" | "full";
  className?: string;
  showSeconds?: boolean;
  showDate?: boolean;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  variant = "badge",
  className = "",
  showSeconds = true,
  showDate = true,
}) => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set immediate current date/time on mount
    setNow(new Date());

    // Update simultaneously every single second
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Hydration protection: render matching lightweight placeholder until client mounts
  if (!now) {
    return (
      <div className={`inline-flex items-center gap-1.5 opacity-60 ${className}`}>
        <Clock className="w-3.5 h-3.5 text-slate-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Synchronizing clock...</span>
      </div>
    );
  }

  // Formatters
  const dayName = now.toLocaleDateString("en-US", { weekday: "short" });
  const dayNameFull = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateFormatted = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dateFullFormatted = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeFormatted = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: true,
  });

  const time24Formatted = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false,
  });

  // Variant 1: Digital Station Clock (For KDS Kitchen, Bar & POS)
  if (variant === "digital") {
    return (
      <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-sm ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-xs font-bold tracking-widest text-cyan-300">
              {time24Formatted}
            </span>
          </div>
          {showDate && (
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              {dayName}, {dateFormatted}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Variant 2: Full Detailed Clock (Navbar banner, Executive Reports, Waiter)
  if (variant === "full") {
    return (
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/90 text-blue-950 shadow-2xs ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold text-slate-800">{dayNameFull}, {dateFullFormatted}</span>
          <span className="text-blue-300 font-semibold">•</span>
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono font-bold text-blue-700 tracking-wide">{timeFormatted}</span>
        </div>
      </div>
    );
  }

  // Variant 3: Clean Header Badge (Admin Layout Header, Navbar right pill)
  if (variant === "header") {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 shadow-2xs ${className}`}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-600">{dayName}, {dateFormatted}</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1 font-mono text-xs font-black text-blue-700">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>{timeFormatted}</span>
        </div>
      </div>
    );
  }

  // Variant 4: Minimal
  if (variant === "minimal") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 ${className}`}>
        <Clock className="w-3 h-3 text-blue-600" />
        <span>{timeFormatted}</span>
      </span>
    );
  }

  // Default Variant: Badge
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs shadow-2xs ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      {showDate && (
        <span className="font-semibold text-slate-700">{dayName}, {dateFormatted}</span>
      )}
      {showDate && <span className="text-blue-300">•</span>}
      <span className="font-mono font-bold text-blue-700">{timeFormatted}</span>
    </div>
  );
};
