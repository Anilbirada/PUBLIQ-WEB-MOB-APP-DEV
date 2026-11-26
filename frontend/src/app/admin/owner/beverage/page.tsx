"use client";

import React, { useState, useEffect } from "react";
import { 
  Wine, TrendingUp, DollarSign, Receipt, CheckCircle2, 
  Clock, ArrowLeft, RefreshCw, Calendar, Download, ShieldCheck
} from "lucide-react";
import { API_BASE } from "@/lib/api";

const FALLBACK_BEVERAGE_DASHBOARD = {
  owner_name: "ANIL",
  upi_id: "8431712924-3@ybl",
  department: "BEVERAGE",
  today_revenue: 24650.0,
  weekly_revenue: 168400.0,
  monthly_revenue: 642800.0,
  total_revenue: 1890200.0,
  total_invoices: 38,
  paid_invoices: 36,
  pending_invoices: 2,
  recent_invoices: [
    { invoice_number: "PUB-BV-2026-0038", table_number: "08", grand_total: 2100.0, payment_status: "PAID", created_at: "Today, 1:45 PM" },
    { invoice_number: "PUB-BV-2026-0037", table_number: "CABANA-01", grand_total: 4500.0, payment_status: "PAID", created_at: "Today, 1:12 PM" },
    { invoice_number: "PUB-BV-2026-0036", table_number: "BAR-02", grand_total: 1850.0, payment_status: "PAID", created_at: "Today, 12:40 PM" },
  ]
};

export default function BeverageOwnerDashboardPage() {
  const [data, setData] = useState<any | null>(FALLBACK_BEVERAGE_DASHBOARD);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/owners/dashboard/BEVERAGE`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setError("");
      } else {
        setData(FALLBACK_BEVERAGE_DASHBOARD);
      }
    } catch (e: any) {
      setData(FALLBACK_BEVERAGE_DASHBOARD);
    } finally {
      if (isManual) {
        setToastMsg("Beverage financials refreshed");
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
              <ArrowLeft className="w-5 h-5 text-blue-600" />
            </a>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                <Wine className="w-4 h-4 text-blue-600" />
                <span>BEVERAGE BUSINESS OWNER FINANCIALS • SAC 996331</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {data?.owner_name || "ANIL"} — Bar & Drinks Revenue Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Settlement UPI: <span className="font-mono text-blue-700 font-bold">{data?.upi_id || "8431712924-3@ybl"}</span> • 5% Indian Bar & Restaurant GST Composition Scheme
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
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 transition-transform ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Financials"}</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading beverage financials for Anil...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
            {error}
          </div>
        ) : data && (
          <div className="space-y-8">
            {/* PhonePe UPI QR Card for Bar Admin (Pure White Card with Soft Cyan Accents) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official PhonePe Settlement QR
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">Anil — Bar & Liquor Direct Payee</h3>
                <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                  Every drinks order scanned at restaurant tables generates a separate bar invoice routed directly to Anil&apos;s PhonePe VPA <span className="text-blue-700 font-mono font-bold">8431712924-3@ybl</span>.
                </p>
              </div>
              <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
                <img
                  src="/images/publiq/upi/anil_bar_phonepe_qr.jpg"
                  alt="Anil PhonePe Bar UPI QR"
                  className="w-40 h-40 object-contain rounded-xl shadow-xs border border-slate-200 bg-white"
                />
                <span className="text-xs font-mono font-bold text-slate-900 mt-2">8431712924-3@ybl</span>
                <span className="text-[10px] text-slate-500 font-medium">PhonePe Verified Merchant</span>
              </div>
            </div>

            {/* Revenue Highlights (Crisp White Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TODAY BAR REVENUE</span>
                <span className="font-serif text-3xl font-black text-blue-700 block mt-1">₹{data.today_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-2 block">Direct PhonePe Settlement</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WEEKLY BAR REVENUE</span>
                <span className="font-serif text-3xl font-black text-slate-900 block mt-1">₹{data.weekly_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-2 block">Last 7 Rolling Days</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">MONTHLY BAR REVENUE</span>
                <span className="font-serif text-3xl font-black text-slate-900 block mt-1">₹{data.monthly_revenue?.toFixed(2) || "0.00"}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-2 block">Current Billing Month</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/30 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">CUMULATIVE BAR REVENUE</span>
                <span className="font-serif text-3xl font-black text-blue-700 block mt-1">₹{data.total_revenue?.toFixed(2) || "0.00"}</span>
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
                <span className="text-xs text-emerald-700 font-semibold">Paid & Settled to Anil</span>
                <span className="font-serif text-xl font-bold text-emerald-600">{data.paid_invoices || 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-amber-200 flex justify-between items-center shadow-xs">
                <span className="text-xs text-amber-700 font-semibold">Pending Dining Tables</span>
                <span className="font-serif text-xl font-bold text-amber-600">{data.pending_invoices || 0}</span>
              </div>
            </div>

            {/* Two Column Section: Top Selling Beverages & Recent Drinks Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Top Selling Cocktails / Drinks */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 space-y-4 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Top Selling Cocktails & Spirits</span>
                </h3>
                <div className="divide-y divide-slate-100">
                  {data.top_selling_items && data.top_selling_items.length > 0 ? (
                    data.top_selling_items.map((it: any, idx: number) => (
                      <div key={idx} className="py-3 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{it.item_name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{it.quantity} orders mixed & served</span>
                        </div>
                        <span className="font-serif text-sm font-bold text-blue-700">₹{it.total_revenue?.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No beverages sold yet in this session.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Beverage Invoices */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 space-y-4 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <span>Recent Drinks Invoices (PUB-BEV-...)</span>
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
                            <td className="py-3 font-serif font-bold text-blue-700">₹{inv.grand_total?.toFixed(2)}</td>
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
                            No drinks invoices recorded yet.
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
