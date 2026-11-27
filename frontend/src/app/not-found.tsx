"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, UtensilsCrossed, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-6 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-slate-50 p-2.5 border border-slate-200 shadow-xs flex items-center justify-center">
          <img src="/logo.png?v=7" alt="PUBLIQ Emblem" className="w-full h-full object-contain" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-blue-600 block">
            404 • Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dish or Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            The page you are looking for may have been moved, removed, or does not exist on our dining portal.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Homepage</span>
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Explore Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
