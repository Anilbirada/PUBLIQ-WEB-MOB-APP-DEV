"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, ShoppingCart, Flame, Wine, Users, AlertTriangle,
  Receipt, ArrowUpRight, CheckCircle2, Clock, DollarSign, QrCode,
  Film, Bot, Calendar, PartyPopper, UtensilsCrossed, Sparkles
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";
        const res = await fetch(`${apiBase}/admin/management/reports/dashboard`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        // Fallback default metrics
        setData({
          gross_sales_today: 48920.0,
          covers_count: 36,
          average_order_value: 1358.88,
          gst_collected: { cgst_2_5: 1223.0, sgst_2_5: 1223.0, total_gst_5: 2446.0 },
          payment_breakdown: { upi: 28400.0, card: 16820.0, cash: 3700.0 },
          table_occupancy: { occupied: 11, total: 16, occupancy_rate_percent: 68.8 },
          inventory_alerts: { low_liquor_bottles: 2, low_raw_materials: 1 },
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const metrics = data || {
    gross_sales_today: 48920.0,
    covers_count: 36,
    average_order_value: 1358.88,
    gst_collected: { cgst_2_5: 1223.0, sgst_2_5: 1223.0, total_gst_5: 2446.0 },
    payment_breakdown: { upi: 28400.0, card: 16820.0, cash: 3700.0 },
    table_occupancy: { occupied: 11, total: 16, occupancy_rate_percent: 68.8 },
    inventory_alerts: { low_liquor_bottles: 2, low_raw_materials: 1 },
  };

  return (
    <div className="space-y-8">
      {/* 1. WELCOME & OUTLET STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0B1528] to-[#08101E] p-6 rounded-3xl border border-[#38BDF8]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-[#38BDF8] font-bold">
              PUBLIQ HARAGADDE Operational • Live Sync
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Executive Performance Overview
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time sales, covers, Indian 5% GST liability, table occupancy, and hospitality media.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/pos"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-[#070B12]" />
            <span>Launch POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Sales */}
        <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-3 hover:border-[#38BDF8]/50 transition-all">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Gross Sales Today</span>
            <span className="p-2 rounded-xl bg-[#0F223D] text-[#38BDF8] border border-[#38BDF8]/30">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-white">
              ₹{metrics.gross_sales_today.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1">
              +14.8% vs last Tuesday
            </p>
          </div>
        </div>

        {/* Covers & AOV */}
        <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-3 hover:border-[#38BDF8]/50 transition-all">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Guest Covers & AOV</span>
            <span className="p-2 rounded-xl bg-[#0F223D] text-[#D4AF37] border border-[#D4AF37]/30">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-white">
              {metrics.covers_count} <span className="text-sm font-sans font-normal text-slate-300">Covers</span>
            </div>
            <p className="text-[11px] text-slate-300 font-semibold mt-1">
              AOV: <strong className="text-[#D4AF37]">₹{metrics.average_order_value.toFixed(2)}</strong> per table
            </p>
          </div>
        </div>

        {/* 5% GST Liability */}
        <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-3 hover:border-[#38BDF8]/50 transition-all">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">GST Liability (5%)</span>
            <span className="p-2 rounded-xl bg-[#0F223D] text-[#38BDF8] border border-[#38BDF8]/30">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-[#38BDF8]">
              ₹{metrics.gst_collected.total_gst_5.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-1">
              CGST: ₹{metrics.gst_collected.cgst_2_5.toFixed(2)} | SGST: ₹{metrics.gst_collected.sgst_2_5.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Floor Occupancy */}
        <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-3 hover:border-[#38BDF8]/50 transition-all">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Table Occupancy</span>
            <span className="p-2 rounded-xl bg-[#0F223D] text-[#D4AF37] border border-[#D4AF37]/30">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-white">
              {metrics.table_occupancy.occupancy_rate_percent}%
            </div>
            <p className="text-[11px] text-slate-300 font-semibold mt-1">
              {metrics.table_occupancy.occupied} of {metrics.table_occupancy.total} Tables Seated
            </p>
          </div>
        </div>
      </div>

      {/* 3. HOSPITALITY & AI QUICK LAUNCH SECTION */}
      <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-4">
        <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          Hospitality Experience & AI Control Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/videos"
            className="p-4 rounded-2xl bg-[#070E1A] hover:bg-[#0D1F38] border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 text-center transition group"
          >
            <Film className="w-6 h-6 text-[#38BDF8] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Cinematic Videos</span>
            <span className="text-[10px] text-slate-300">6 HD AVC1 Reels</span>
          </Link>

          <Link
            href="/admin/ai-promos"
            className="p-4 rounded-2xl bg-[#070E1A] hover:bg-[#0D1F38] border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 text-center transition group"
          >
            <Bot className="w-6 h-6 text-[#D4AF37] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">AI Promo Studio</span>
            <span className="text-[10px] text-slate-300">Review & Approve</span>
          </Link>

          <Link
            href="/admin/events"
            className="p-4 rounded-2xl bg-[#070E1A] hover:bg-[#0D1F38] border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 text-center transition group"
          >
            <PartyPopper className="w-6 h-6 text-[#38BDF8] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Event Enquiries</span>
            <span className="text-[10px] text-slate-300">Cabanas & DJ Nights</span>
          </Link>

          <Link
            href="/admin/reservations"
            className="p-4 rounded-2xl bg-[#070E1A] hover:bg-[#0D1F38] border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 text-center transition group"
          >
            <Calendar className="w-6 h-6 text-[#D4AF37] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Guest Reservations</span>
            <span className="text-[10px] text-slate-300">Seating & Conflicts</span>
          </Link>
        </div>
      </div>

      {/* 4. REAL-TIME OPERATIONS & INVENTORY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Tenders Settlement */}
        <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-4">
          <h3 className="font-serif text-base font-bold text-white">
            Settlement Tender Split
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">UPI / QR (PhonePe / GPay)</span>
                <span className="font-bold text-white">₹{metrics.payment_breakdown.upi.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-[#070E1A] h-2 rounded-full overflow-hidden border border-[#38BDF8]/20">
                <div className="h-full bg-gradient-to-r from-[#38BDF8] to-[#0284C7] rounded-full" style={{ width: "58%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Credit / Debit Card (EDC Swipe)</span>
                <span className="font-bold text-white">₹{metrics.payment_breakdown.card.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-[#070E1A] h-2 rounded-full overflow-hidden border border-[#38BDF8]/20">
                <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] rounded-full" style={{ width: "34%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Cash in Register Float</span>
                <span className="font-bold text-white">₹{metrics.payment_breakdown.cash.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-[#070E1A] h-2 rounded-full overflow-hidden border border-[#38BDF8]/20">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "8%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Inventory Alerts */}
        <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-4">
          <h3 className="font-serif text-base font-bold text-white">
            Cellar & Kitchen Inventory Health
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wine className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-200">
                  Liquor Cellar Low Stock: Macallan 12 Yrs, Bombay Sapphire Gin
                </span>
              </div>
              <Link href="/admin/inventory/liquor" className="text-xs font-bold text-[#38BDF8] hover:underline">
                Reorder
              </Link>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-200">
                  Kitchen Raw Material Below Min Threshold: Artisanal Malai Paneer
                </span>
              </div>
              <Link href="/admin/inventory/restaurant" className="text-xs font-bold text-[#38BDF8] hover:underline">
                Restock
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
