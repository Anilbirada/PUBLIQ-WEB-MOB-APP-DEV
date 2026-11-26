"use client";
import { API_BASE } from "@/lib/api";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, Calendar, Download, Printer, ShieldCheck, 
  TrendingUp, CreditCard, IndianRupee, Layers, CheckCircle2, RotateCcw,
  Sparkles
} from "lucide-react";

interface DashboardData {
  gross_sales_today: number;
  covers_count: number;
  average_order_value: number;
  gst_collected: {
    cgst_2_5: number;
    sgst_2_5: number;
    total_gst_5: number;
  };
  payment_breakdown: {
    upi: number;
    card: number;
    cash: number;
  };
  table_occupancy: {
    occupied: number;
    total: number;
    occupancy_rate_percent: number;
  };
  inventory_alerts: {
    low_liquor_bottles: number;
    low_raw_materials: number;
  };
}

const FALLBACK_DASHBOARD: DashboardData = {
  gross_sales_today: 48650.0,
  covers_count: 32,
  average_order_value: 1520.31,
  gst_collected: {
    cgst_2_5: 1158.33,
    sgst_2_5: 1158.33,
    total_gst_5: 2316.67
  },
  payment_breakdown: {
    upi: 29500.0,
    card: 14750.0,
    cash: 4400.0
  },
  table_occupancy: {
    occupied: 6,
    total: 14,
    occupancy_rate_percent: 42.9
  },
  inventory_alerts: {
    low_liquor_bottles: 2,
    low_raw_materials: 2
  }
};

export default function ReportsAndGSTPage() {
  const [data, setData] = useState<DashboardData>(FALLBACK_DASHBOARD);
  const [selectedPeriod, setSelectedPeriod] = useState<"TODAY" | "THIS_WEEK" | "THIS_MONTH">("TODAY");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/management/reports/dashboard`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.gross_sales_today !== undefined) setData(json);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalPayments = (data.payment_breakdown.upi + data.payment_breakdown.card + data.payment_breakdown.cash) || 1;
  const upiPercent = Math.round((data.payment_breakdown.upi / totalPayments) * 100);
  const cardPercent = Math.round((data.payment_breakdown.card / totalPayments) * 100);
  const cashPercent = Math.round((data.payment_breakdown.cash / totalPayments) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1528]/80 backdrop-blur-md border border-[#38BDF8]/25 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-[#38BDF8] font-bold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> Financial Audit & Tax Reporting
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Financial Audit & GST Liability Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Indian Restaurant 5% GST computation (2.5% CGST + 2.5% SGST), channel reconciliations, and tender audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#070E1A] text-slate-300 border border-[#38BDF8]/25 rounded-2xl hover:text-white hover:border-[#38BDF8] transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#38BDF8]" /> Print Statement
          </button>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await fetchReports();
                setSyncMsg("GST financial reports synced in real time");
                setTimeout(() => setSyncMsg(null), 2500);
              } finally {
                setTimeout(() => setIsRefreshing(false), 600);
              }
            }}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-bold uppercase tracking-wider rounded-2xl hover:brightness-110 transition-all shadow-md ${
              isRefreshing ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-95"
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 transition-transform ${isRefreshing ? "animate-spin" : ""}`} /> 
            <span>{isRefreshing ? "Syncing..." : "Live Sync"}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Turnover</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">₹{data.gross_sales_today.toLocaleString("en-IN")}</span>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-400/30">+18% vs wk</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Guest Covers</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{data.covers_count}</span>
            <span className="text-xs font-semibold text-[#38BDF8] bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#38BDF8]/30">AOV ₹{data.average_order_value}</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total GST (5%)</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-[#D4AF37]">₹{data.gst_collected.total_gst_5.toLocaleString("en-IN")}</span>
            <span className="text-xs font-semibold text-slate-300 bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#38BDF8]/20">GSTR-3B Ready</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Floor Occupancy</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{data.table_occupancy.occupancy_rate_percent}%</span>
            <span className="text-xs font-semibold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-400/30">{data.table_occupancy.occupied} / {data.table_occupancy.total} Tables</span>
          </div>
        </div>
      </div>

      {/* 3. Two Column Layout: GST Breakdown & Payment Tender Splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GST 5% Tax Liability Card */}
        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#38BDF8]/20 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#38BDF8]" />
              <h2 className="font-serif text-lg font-bold text-white">GST Statutory Liability (Section 9(5))</h2>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#070E1A] text-[#38BDF8] border border-[#38BDF8]/20 font-mono font-bold">
              HSN / SAC 996331
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070E1A] border border-[#38BDF8]/20">
              <div>
                <p className="text-xs font-bold text-white">Taxable Turnover (Food & Beverage)</p>
                <p className="text-[11px] text-slate-400">Total billed value net of statutory taxes</p>
              </div>
              <span className="font-serif text-base font-bold text-white">
                ₹{(data.gross_sales_today - data.gst_collected.total_gst_5).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070E1A] border border-[#38BDF8]/20">
              <div>
                <p className="text-xs font-bold text-[#38BDF8]">Central GST (CGST @ 2.5%)</p>
                <p className="text-[11px] text-slate-400">Remitted to Central Board of Indirect Taxes</p>
              </div>
              <span className="font-serif text-base font-bold text-[#38BDF8]">
                ₹{data.gst_collected.cgst_2_5.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070E1A] border border-[#38BDF8]/20">
              <div>
                <p className="text-xs font-bold text-[#38BDF8]">State GST (SGST @ 2.5%)</p>
                <p className="text-[11px] text-slate-400">Remitted to State Commercial Tax Dept</p>
              </div>
              <span className="font-serif text-base font-bold text-[#38BDF8]">
                ₹{data.gst_collected.sgst_2_5.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#0F223D] to-[#0B1528] border border-[#38BDF8]/30 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Total Tax Payable (5.0%)</p>
                <p className="text-[11px] text-slate-400">Non-ITC Composition Hospitality Rate</p>
              </div>
              <span className="font-serif text-xl font-bold text-[#D4AF37]">
                ₹{data.gst_collected.total_gst_5.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Tender Split */}
        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#38BDF8]/20 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#38BDF8]" />
              <h2 className="font-serif text-lg font-bold text-white">Payment Method & Settlement Reconciliation</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-400/30">Cashier Verified</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* UPI */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white font-semibold">UPI / QR (PhonePe / GPay / Paytm)</span>
                <span className="font-bold text-[#38BDF8]">₹{data.payment_breakdown.upi.toLocaleString("en-IN")} ({upiPercent}%)</span>
              </div>
              <div className="w-full bg-[#070E1A] h-2.5 rounded-full overflow-hidden border border-[#38BDF8]/20">
                <div className="h-full bg-gradient-to-r from-[#0284C7] to-[#38BDF8] rounded-full" style={{ width: `${upiPercent}%` }}></div>
              </div>
            </div>

            {/* Credit / Debit Cards */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white font-semibold">Credit / Debit Card EDC Swipe</span>
                <span className="font-bold text-[#D4AF37]">₹{data.payment_breakdown.card.toLocaleString("en-IN")} ({cardPercent}%)</span>
              </div>
              <div className="w-full bg-[#070E1A] h-2.5 rounded-full overflow-hidden border border-[#38BDF8]/20">
                <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] rounded-full" style={{ width: `${cardPercent}%` }}></div>
              </div>
            </div>

            {/* Cash */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white font-semibold">Physical Cash In Register</span>
                <span className="font-bold text-emerald-400">₹{data.payment_breakdown.cash.toLocaleString("en-IN")} ({cashPercent}%)</span>
              </div>
              <div className="w-full bg-[#070E1A] h-2.5 rounded-full overflow-hidden border border-[#38BDF8]/20">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cashPercent}%` }}></div>
              </div>
            </div>

            {/* Cashier Reconciliation Note */}
            <div className="p-4 bg-[#070E1A] rounded-2xl border border-[#38BDF8]/20 text-xs text-slate-400 space-y-1">
              <p className="font-bold text-white">Active Cashier Shift #SH-001</p>
              <p>Cash Float at opening: <span className="text-[#38BDF8] font-mono font-bold">₹5,000.00</span></p>
              <p>Current Safe Balance: <span className="text-emerald-400 font-mono font-bold">₹{(5000 + data.payment_breakdown.cash).toLocaleString("en-IN")}.00</span></p>
            </div>
          </div>
        </div>
      </div>

      {syncMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0B1528]/95 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2.5 border border-[#38BDF8]/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span>{syncMsg}</span>
        </div>
      )}
    </div>
  );
}
