"use client";

import React, { useState, useEffect } from "react";
import { 
  Utensils, TrendingUp, DollarSign, Receipt, CheckCircle2, 
  Clock, ArrowLeft, RefreshCw, Calendar, Download, ShieldCheck
} from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function FoodOwnerDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/owners/dashboard/FOOD`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        throw new Error("Failed to load food financials");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-4">
            <a
              href="/admin/owners"
              className="p-2.5 rounded-full bg-[#0A111F] hover:bg-[#0F1626] border border-[#D4AF37]/30 text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                <Utensils className="w-4 h-4 text-[#D4AF37]" />
                <span>FOOD BUSINESS OWNER FINANCIALS • SAC 996331</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white mt-1">
                {data?.owner_name || "RAMESH S P"} — Kitchen Revenue Portal
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Settlement UPI: <span className="font-mono text-[#D4AF37] font-bold">{data?.upi_id || "ramesh776059@ybl"}</span> • 5% Indian Restaurant GST Composition Scheme
              </p>
            </div>
          </div>

          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1626] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] hover:bg-[#151F33] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Financials</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading food financials for Ramesh S P...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/40 border border-rose-500/40 rounded-3xl text-rose-300 text-sm">
            {error}
          </div>
        ) : data && (
          <div className="space-y-8">
            {/* PhonePe UPI QR Card for Food Admin */}
            <div className="bg-[#0A111F] rounded-3xl p-6 border border-[#D4AF37]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl bg-gradient-to-r from-[#0A111F] via-[#1D1708] to-[#0A111F]">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official PhonePe Settlement QR
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">Ramesh S P — Kitchen &amp; Food Direct Payee</h3>
                <p className="text-xs text-slate-400 max-w-lg">
                  Every food order scanned at restaurant tables generates a separate kitchen invoice routed directly to Ramesh S P&apos;s PhonePe VPA <span className="text-[#D4AF37] font-mono font-bold">ramesh776059@ybl</span>.
                </p>
              </div>
              <div className="flex flex-col items-center bg-black/60 p-4 rounded-2xl border border-[#D4AF37]/20">
                <img
                  src="/images/publiq/upi/ramesh_food_phonepe_qr.jpg"
                  alt="Ramesh S P PhonePe Food UPI QR"
                  className="w-36 h-36 object-contain rounded-xl shadow-lg border border-white/10"
                />
                <span className="text-[11px] font-mono font-bold text-[#D4AF37] mt-2">ramesh776059@ybl</span>
                <span className="text-[10px] text-slate-400">PhonePe Verified Merchant</span>
              </div>
            </div>
            {/* Revenue Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0A111F] rounded-2xl p-5 border border-[#D4AF37]/25 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TODAY FOOD REVENUE</span>
                <span className="font-serif text-3xl font-bold text-[#D4AF37] block mt-1">₹{data.today_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-emerald-400 font-bold mt-2 block">Direct PhonePe Settlement</span>
              </div>

              <div className="bg-[#0A111F] rounded-2xl p-5 border border-slate-800 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WEEKLY FOOD REVENUE</span>
                <span className="font-serif text-3xl font-bold text-white block mt-1">₹{data.weekly_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-400 mt-2 block">Last 7 Rolling Days</span>
              </div>

              <div className="bg-[#0A111F] rounded-2xl p-5 border border-slate-800 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">MONTHLY FOOD REVENUE</span>
                <span className="font-serif text-3xl font-bold text-white block mt-1">₹{data.monthly_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-400 mt-2 block">Current Billing Month</span>
              </div>

              <div className="bg-[#0A111F] rounded-2xl p-5 border border-[#D4AF37]/40 bg-gradient-to-br from-[#0A111F] to-[#141C2E] shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">CUMULATIVE FOOD REVENUE</span>
                <span className="font-serif text-3xl font-bold text-[#D4AF37] block mt-1">₹{data.total_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-400 mt-2 block">{data.paid_invoices} Settled Invoices</span>
              </div>
            </div>

            {/* Invoices Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#070B12] border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Total Invoices Issued</span>
                <span className="font-serif text-xl font-bold text-white">{data.total_invoices || 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#070B12] border border-emerald-500/30 flex justify-between items-center">
                <span className="text-xs text-emerald-400 font-bold">Paid &amp; Settled to Anil</span>
                <span className="font-serif text-xl font-bold text-emerald-400">{data.paid_invoices || 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#070B12] border border-amber-500/30 flex justify-between items-center">
                <span className="text-xs text-amber-400 font-bold">Pending Dining Tables</span>
                <span className="font-serif text-xl font-bold text-amber-400">{data.pending_invoices || 0}</span>
              </div>
            </div>

            {/* Two Column Section: Top Selling Food & Recent Food Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Top Selling Food Dishes */}
              <div className="lg:col-span-5 bg-[#0A111F] rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                  <span>Top Selling Culinary Dishes</span>
                </h3>
                <div className="divide-y divide-slate-800">
                  {data.top_selling_items && data.top_selling_items.length > 0 ? (
                    data.top_selling_items.map((it: any, idx: number) => (
                      <div key={idx} className="py-3 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-white block">{it.item_name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{it.quantity} orders fulfilled</span>
                        </div>
                        <span className="font-serif text-sm font-bold text-[#D4AF37]">₹{it.total_revenue?.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No food dishes sold yet in this session.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Food Invoices */}
              <div className="lg:col-span-7 bg-[#0A111F] rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#D4AF37]" />
                  <span>Recent Food Invoices (PUB-FOOD-...)</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-3">Invoice No</th>
                        <th className="pb-3">Table</th>
                        <th className="pb-3">Grand Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Steward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.recent_invoices && data.recent_invoices.length > 0 ? (
                        data.recent_invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-slate-900/50">
                            <td className="py-3 font-mono font-bold text-white">{inv.invoice_number}</td>
                            <td className="py-3 text-slate-300">T-{inv.table_number}</td>
                            <td className="py-3 font-serif font-bold text-[#D4AF37]">₹{inv.grand_total?.toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.payment_status === "PAID" 
                                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30" 
                                  : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                              }`}>
                                {inv.payment_status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400">{inv.waiter_name || "Steward"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No food invoices recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
