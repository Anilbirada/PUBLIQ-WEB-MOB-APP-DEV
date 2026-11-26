"use client";

import React, { useState, useEffect } from "react";
import { 
  Utensils, TrendingUp, DollarSign, Receipt, CheckCircle2, 
  Clock, ArrowLeft, RefreshCw, Calendar, Download, ShieldCheck
} from "lucide-react";
import { API_BASE } from "@/lib/api";

const FALLBACK_FOOD_DASHBOARD = {
  owner_name: "RAMESH S P",
  upi_id: "ramesh776059@ybl",
  department: "FOOD",
  today_revenue: 18450.0,
  weekly_revenue: 124800.0,
  monthly_revenue: 489200.0,
  total_revenue: 1420500.0,
  total_invoices: 42,
  paid_invoices: 39,
  pending_invoices: 3,
  recent_invoices: [
    { invoice_number: "PUB-FD-2026-0042", table_number: "08", grand_total: 1450.0, payment_status: "PAID", created_at: "Today, 1:45 PM" },
    { invoice_number: "PUB-FD-2026-0041", table_number: "CABANA-01", grand_total: 3200.0, payment_status: "PAID", created_at: "Today, 1:12 PM" },
    { invoice_number: "PUB-FD-2026-0040", table_number: "04", grand_total: 890.0, payment_status: "PAID", created_at: "Today, 12:30 PM" },
  ]
};

export default function FoodOwnerDashboardPage() {
  const [data, setData] = useState<any | null>(FALLBACK_FOOD_DASHBOARD);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/owners/dashboard/FOOD`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setError("");
      } else {
        setData(FALLBACK_FOOD_DASHBOARD);
      }
    } catch (e: any) {
      setData(FALLBACK_FOOD_DASHBOARD);
    } finally {
      if (isManual) {
        setToastMsg("Food financials refreshed");
        setTimeout(() => setToastMsg(null), 2500);
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  useEffect(() => {
    fetchDashboard(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <a
              href="/admin/owners"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-5 h-5 text-amber-600" />
            </a>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>FOOD BUSINESS OWNER FINANCIALS • SAC 996331</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {data?.owner_name || "RAMESH S P"} — Kitchen Revenue Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Settlement UPI: <span className="font-mono text-amber-700 font-bold">{data?.upi_id || "ramesh776059@ybl"}</span> • 5% Indian Restaurant GST Composition Scheme
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchDashboard(true)}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs ${
              isRefreshing ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-95"
            }`}
            title="Refresh Financials"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 transition-transform ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Financials"}</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading food financials for Ramesh S P...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
            {error}
          </div>
        ) : data && (
          <div className="space-y-8">
            {/* PhonePe UPI QR Card for Food Admin (Pure White Card with Amber Accents) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official PhonePe Settlement QR
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">Ramesh S P — Kitchen & Dining Direct Payee</h3>
                <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                  Every food order scanned at restaurant tables generates a separate food invoice routed directly to Ramesh S P&apos;s PhonePe VPA <span className="text-amber-700 font-mono font-bold">ramesh776059@ybl</span>.
                </p>
              </div>
              <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
                <img
                  src="/images/publiq/upi/ramesh_food_phonepe_qr.jpg"
                  alt="Ramesh S P PhonePe Food UPI QR"
                  className="w-40 h-40 object-contain rounded-xl shadow-xs border border-slate-200 bg-white"
                />
                <span className="text-xs font-mono font-bold text-slate-900 mt-2">ramesh776059@ybl</span>
                <span className="text-[10px] text-slate-500 font-medium">PhonePe Verified Merchant</span>
              </div>
            </div>

            {/* Revenue Highlights (Crisp White Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TODAY FOOD REVENUE</span>
                <span className="font-serif text-3xl font-black text-amber-700 block mt-1">₹{data.today_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-2 block">Direct PhonePe Settlement</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WEEKLY FOOD REVENUE</span>
                <span className="font-serif text-3xl font-black text-slate-900 block mt-1">₹{data.weekly_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-2 block">Last 7 Rolling Days</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">MONTHLY FOOD REVENUE</span>
                <span className="font-serif text-3xl font-black text-slate-900 block mt-1">₹{data.monthly_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-2 block">Current Billing Month</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/30 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">CUMULATIVE FOOD REVENUE</span>
                <span className="font-serif text-3xl font-black text-amber-700 block mt-1">₹{data.total_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-2 block">{data.paid_invoices} Settled Invoices</span>
              </div>
            </div>

            {/* Invoices Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex justify-between items-center shadow-xs">
                <span className="text-xs text-slate-500 font-semibold">Total Invoices Issued</span>
                <span className="font-serif text-xl font-bold text-slate-900">{data.total_invoices || 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-emerald-200 flex justify-between items-center shadow-xs">
                <span className="text-xs text-emerald-700 font-semibold">Paid & Settled to Ramesh</span>
                <span className="font-serif text-xl font-bold text-emerald-600">{data.paid_invoices || 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-amber-200 flex justify-between items-center shadow-xs">
                <span className="text-xs text-amber-700 font-semibold">Pending Dining Tables</span>
                <span className="font-serif text-xl font-bold text-amber-600">{data.pending_invoices || 0}</span>
              </div>
            </div>

            {/* Two Column Section: Top Selling Dishes & Recent Food Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Top Selling Food Dishes */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 space-y-4 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <span>Top Selling Culinary Dishes</span>
                </h3>
                <div className="divide-y divide-slate-100">
                  {data.top_selling_items && data.top_selling_items.length > 0 ? (
                    data.top_selling_items.map((it: any, idx: number) => (
                      <div key={idx} className="py-3 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{it.item_name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{it.quantity} portions cooked & served</span>
                        </div>
                        <span className="font-serif text-sm font-bold text-amber-700">₹{it.total_revenue?.toFixed(2)}</span>
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
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 space-y-4 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  <span>Recent Food Invoices (PUB-FOOD-...)</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="pb-3">Invoice No</th>
                        <th className="pb-3">Table</th>
                        <th className="pb-3">Grand Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Steward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recent_invoices && data.recent_invoices.length > 0 ? (
                        data.recent_invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="py-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                            <td className="py-3 text-slate-600">T-{inv.table_number}</td>
                            <td className="py-3 font-serif font-bold text-amber-700">₹{inv.grand_total?.toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.payment_status === "PAID" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {inv.payment_status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500">{inv.waiter_name || "Steward"}</td>
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

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
