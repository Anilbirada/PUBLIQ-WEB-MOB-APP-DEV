"use client";
import { API_BASE } from "@/lib/api";

import React, { useState, useEffect } from "react";
import {
  Flame, Clock, CheckCircle2, AlertTriangle, ArrowRight,
  RefreshCw, ChefHat, Timer, Bell, User, Utensils, Sparkles
} from "lucide-react";

export default function KotPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeStation, setActiveStation] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/operations/kot/tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (_) {
      // Mock fallback tickets
      setTickets([
        {
          order_id: "ord-kot-1",
          order_number: "PUB-HQ-01-9481",
          table_number: "08",
          customer_name: "Aakash Mehta",
          status: "PREPARING",
          food_status: "Cooking in Clay Tandoor",
          elapsed_minutes: 12,
          is_delayed: false,
          special_instructions: "Make Kalmi Kebab extra crisp, less butter in Dal",
          items: [
            { id: "1", item_name: "Charcoal Kalmi Kebab", quantity: 2, variant_name: "Full Portion", special_instructions: "Crisp char" },
            { id: "2", item_name: "24-Hour Dal Makhani", quantity: 1, variant_name: "Regular Handi", special_instructions: "Less butter" },
            { id: "3", item_name: "Garlic Butter Naan", quantity: 3, variant_name: null },
          ]
        },
        {
          order_id: "ord-kot-2",
          order_number: "PUB-HQ-01-9485",
          table_number: "CABANA-01",
          customer_name: "Pooja Hegde",
          status: "ACCEPTED",
          food_status: "Ticket Confirmed by Chef",
          elapsed_minutes: 24,
          is_delayed: true,
          special_instructions: "No onions, Jain preparation where possible",
          items: [
            { id: "4", item_name: "Royal Paneer Malai Tikka", quantity: 1, variant_name: "Standard Platter" },
            { id: "5", item_name: "Truffle Malai Broccoli", quantity: 1, variant_name: null },
          ]
        },
        {
          order_id: "ord-kot-3",
          order_number: "PUB-HQ-01-9490",
          table_number: "04",
          customer_name: "Siddharth Rao",
          status: "PLACED",
          food_status: "New Ticket Queued",
          elapsed_minutes: 4,
          is_delayed: false,
          special_instructions: null,
          items: [
            { id: "6", item_name: "Old Delhi Butter Chicken", quantity: 1, variant_name: "Family Handi Bowl" },
            { id: "7", item_name: "Hyderabadi Chicken Dum Biryani", quantity: 1, variant_name: "Double Handi" },
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBump = async (orderId: string, currentStatus: string) => {
    try {
      await fetch(`${API_BASE}/admin/operations/kot/bump`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      await fetchTickets();
    } catch (_) {
      // Local optimistic update
      setTickets((prev) =>
        prev.map((t) => {
          if (t.order_id === orderId) {
            const next = t.status === "PLACED" ? "ACCEPTED" : t.status === "ACCEPTED" ? "PREPARING" : "READY";
            return { ...t, status: next };
          }
          return t;
        })
      );
    }
  };

  const activeCount = tickets.filter(t => t.status !== "READY").length;
  const delayedCount = tickets.filter(t => t.is_delayed).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. KDS Executive Header & Live Metrics (Pure White Card) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-blue-600" /> Real-Time Kitchen Display System (KDS)
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Cook Stations & Ticket Routing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Synchronized dispatch across Clay Oven Tandoor, Curries, Continental & Runner Stations.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-xs">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Tickets</p>
            <p className="text-2xl font-serif font-black text-blue-700">{activeCount}</p>
          </div>
          <div className={`px-5 py-3 rounded-xl border text-center shadow-xs ${
            delayedCount > 0 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-slate-50 border-slate-200 text-slate-500"
          }`}>
            <p className="text-[10px] uppercase font-bold tracking-wider">Rush / Delayed</p>
            <p className="text-2xl font-serif font-black text-rose-600">{delayedCount}</p>
          </div>
          <button
            onClick={fetchTickets}
            className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-xs"
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* 2. Station Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-x-auto">
        {[
          { key: "ALL", label: "All Live Stations" },
          { key: "TANDOOR", label: "Clay Oven Tandoor" },
          { key: "CURRIES", label: "Indian Curries & Biryani" },
          { key: "CONTINENTAL", label: "Continental & Sizzlers" },
        ].map((st) => (
          <button
            key={st.key}
            onClick={() => setActiveStation(st.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeStation === st.key
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* 3. Tickets Grid (Crisp White Ticket Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((t) => {
          const isReady = t.status === "READY";
          const isPreparing = t.status === "PREPARING";
          const isAccepted = t.status === "ACCEPTED";
          const isPlaced = t.status === "PLACED";

          return (
            <div
              key={t.order_id}
              className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all bg-white ${
                t.is_delayed
                  ? "border-rose-400 ring-2 ring-rose-200"
                  : isReady
                  ? "border-emerald-300"
                  : isPreparing
                  ? "border-amber-300"
                  : "border-slate-200"
              }`}
            >
              {/* Ticket Top Bar */}
              <div className={`p-5 border-b border-slate-100 space-y-3 ${
                t.is_delayed ? "bg-rose-50/60" : isReady ? "bg-emerald-50/60" : "bg-slate-50/70"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                      {t.table_number}
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">Table {t.table_number}</h3>
                      <p className="text-[11px] font-mono text-slate-500">Order #{t.order_number}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                        t.is_delayed
                          ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                          : "bg-white text-slate-700 border-slate-200 shadow-xs"
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5 text-blue-600" />
                      {t.elapsed_minutes}m elapsed
                    </span>
                    {t.is_delayed && (
                      <span className="text-[9px] uppercase tracking-wider text-rose-700 font-extrabold block mt-1">
                        PRIORITY RUSH
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-blue-600" /> {t.customer_name}
                  </span>
                  <span className="font-bold text-[10px] text-blue-700 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                    {t.food_status}
                  </span>
                </div>

                {t.special_instructions && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-snug">
                    <strong className="font-bold text-amber-800">Chef Note:</strong> {t.special_instructions}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="p-5 flex-1 space-y-2">
                {t.items.map((it: any) => (
                  <div
                    key={it.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-black text-xs text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                          {it.quantity}x
                        </span>
                        <span className="font-bold text-slate-900">{it.item_name}</span>
                      </div>
                      {it.variant_name && (
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 pl-8">
                          {it.variant_name}
                        </p>
                      )}
                    </div>
                    {it.special_instructions && (
                      <span className="text-[10px] text-amber-800 font-bold italic bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        {it.special_instructions}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Bump Button */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                <button
                  onClick={() => handleBump(t.order_id, t.status)}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 ${
                    isPlaced
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 hover:shadow-md"
                      : isAccepted
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20 hover:shadow-md"
                      : isPreparing
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 hover:shadow-md"
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  {isPlaced && "✓ Accept Ticket & Print KOT"}
                  {isAccepted && "🔥 Mark Cooking in Tandoor"}
                  {isPreparing && "✓ Mark Cooked & Ready for Runner"}
                  {isReady && "✓ Order Delivered & Completed"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
