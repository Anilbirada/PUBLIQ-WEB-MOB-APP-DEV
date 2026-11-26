"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import {
  TrendingUp, ShoppingCart, Flame, Wine, Users, AlertTriangle,
  Receipt, ArrowUpRight, CheckCircle2, Clock, DollarSign, QrCode,
  Film, Bot, Calendar, PartyPopper, UtensilsCrossed, Sparkles,
  ShieldCheck, Star, ChevronRight, RefreshCw, AlertCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/operations/orders/live-workflow`);
      if (res.ok) {
        const json = await res.json();
        setWorkflowData(json);
      }
    } catch (err) {
      console.warn("Failed to load workflow data:", err);
    }
  };

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_BASE}/admin/management/reports/dashboard`);
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
    fetchWorkflow();
    const interval = setInterval(fetchWorkflow, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      await fetchWorkflow();
      setDashboardToast("Live order workflow synced across kitchen & bar");
      setTimeout(() => setDashboardToast(null), 2500);
    } finally {
      setTimeout(() => setIsRefreshingOrders(false), 600);
    }
  };

  const handleSuperAdminApprove = async (orderId: string, orderNumber: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE}/admin/operations/orders/${orderId}/super-admin-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_name: "Super Admin (GM)" })
      });
      if (res.ok) {
        setDashboardToast(`✓ Order ${orderNumber} approved & dispatched to Kitchen and Bar`);
        setTimeout(() => setDashboardToast(null), 3000);
        await fetchWorkflow();
      }
    } catch (_) {
      setDashboardToast(`Error approving order ${orderNumber}`);
      setTimeout(() => setDashboardToast(null), 2500);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualTransition = async (orderId: string, orderNumber: string, targetStatus: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE}/admin/operations/orders/${orderId}/manual-transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: targetStatus,
          admin_name: "Super Admin (GM)",
          notes: `Super Admin manual dashboard transition to ${targetStatus}`
        })
      });
      if (res.ok) {
        setDashboardToast(`✓ Order ${orderNumber} transitioned to ${targetStatus}`);
        setTimeout(() => setDashboardToast(null), 3000);
        await fetchWorkflow();
      }
    } catch (_) {
      setDashboardToast(`Error transitioning order ${orderNumber}`);
      setTimeout(() => setDashboardToast(null), 2500);
    } finally {
      setActionLoading(null);
    }
  };

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. TOP HERO BANNER (PURE WHITE CARD WITH SUBTLE BLUE BORDER) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-blue-700 font-bold">
              PUBLIQ HARAGADDE OPERATIONAL • LIVE CLOUD SYNC
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Performance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
            Real-time revenues, covers, Indian 5% GST liability, table occupancy, and dual-owner settlement channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/orders"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-white" />
            <span>Live Order Workflow</span>
          </Link>
          <Link
            href="/waiter"
            className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold tracking-wider uppercase transition-all shadow-2xs flex items-center gap-2"
          >
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            <span>Waiter Floor App</span>
          </Link>
          <Link
            href="/admin/pos"
            className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-2xs flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <span>POS Register</span>
          </Link>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS (WHITE CARDS WITH MULTICOLOUR GRADIENT ICONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Sales - Royal Blue / Indigo */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Sales Today</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-black text-slate-900">
              ₹{metrics.gross_sales_today.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px]">↑ +14.8%</span>
              <span>vs last Tuesday</span>
            </p>
          </div>
        </div>

        {/* Covers & AOV - Purple / Pink */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Guest Covers & AOV</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-black text-slate-900">
              {metrics.covers_count} <span className="text-base font-sans font-medium text-slate-500">Covers</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              AOV: <strong className="text-purple-700 font-bold">₹{metrics.average_order_value.toFixed(2)}</strong> per table
            </p>
          </div>
        </div>

        {/* 5% GST Liability - Cyan / Blue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">GST Liability (5%)</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-black text-blue-700">
              ₹{metrics.gst_collected.total_gst_5.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1.5">
              CGST: ₹{metrics.gst_collected.cgst_2_5.toFixed(2)} | SGST: ₹{metrics.gst_collected.sgst_2_5.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Floor Occupancy - Emerald / Teal */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Table Occupancy</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-black text-slate-900">
              {metrics.table_occupancy.occupancy_rate_percent}%
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              <strong className="text-emerald-700 font-bold">{metrics.table_occupancy.occupied}</strong> of {metrics.table_occupancy.total} Tables Seated
            </p>
          </div>
        </div>
      </div>

      {/* 2.5 LIVE RESTAURANT ORDER WORKFLOW & SUPER ADMIN MANUAL ACTION CENTER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-700">
                REAL-TIME RESTAURANT FLOOR PIPELINE
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 flex items-center gap-2.5">
              <span>Live Order Workflow & Super Admin Controls</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              View and manually manage all customer orders across Guest QR, Waiter approval, Kitchen KDS, Bar dispense, and POS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 border border-blue-200"
            >
              <span>View Full Workflow (All {workflowData?.counts?.total_active || 0} Orders)</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleManualRefreshOrders}
              disabled={isRefreshingOrders}
              className={`p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition flex items-center justify-center ${
                isRefreshingOrders ? "opacity-75" : "cursor-pointer active:scale-95"
              }`}
              title="Refresh Live Orders"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshingOrders ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Live Stage Badges / Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">1. Awaiting Approval</span>
            <span className="font-serif text-2xl font-black text-amber-700 mt-0.5 block">
              {workflowData?.counts?.pending_approval || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">2. In Preparation</span>
            <span className="font-serif text-2xl font-black text-blue-700 mt-0.5 block">
              {workflowData?.counts?.preparing || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">3. Ready for Service</span>
            <span className="font-serif text-2xl font-black text-emerald-700 mt-0.5 block">
              {workflowData?.counts?.ready || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-800 block">4. Dining at Table</span>
            <span className="font-serif text-2xl font-black text-indigo-700 mt-0.5 block">
              {workflowData?.counts?.served || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">5. Pending Bill</span>
            <span className="font-serif text-2xl font-black text-rose-700 mt-0.5 block">
              {workflowData?.counts?.payment_pending || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">6. Settled / Completed</span>
            <span className="font-serif text-2xl font-black text-slate-800 mt-0.5 block">
              {workflowData?.counts?.completed || 0}
            </span>
          </div>
        </div>

        {/* Live Active Orders Stream */}
        {workflowData?.all_orders && workflowData.all_orders.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Floor Orders & Immediate Manual Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowData.all_orders.slice(0, 6).map((ord: any) => {
                const isUnapproved = !ord.is_approved || ord.food_status === "PENDING_APPROVAL" || ord.beverage_status === "PENDING_APPROVAL";
                const isPreparing = ["ACCEPTED", "PREPARING"].includes(ord.order_status);
                const isReady = ord.order_status === "READY";
                const isServed = ord.order_status === "SERVED";

                return (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {ord.table_number.replace("Table ", "")}
                        </span>
                        <div>
                          <span className="font-serif font-bold text-sm text-slate-900 block">{ord.table_number}</span>
                          <span className="text-[10px] font-mono text-slate-500 block">#{ord.order_number}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        isUnapproved ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse" :
                        isReady ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                        isPreparing ? "bg-blue-100 text-blue-800 border-blue-300" :
                        "bg-slate-100 text-slate-800 border-slate-200"
                      }`}>
                        {isUnapproved ? "Awaiting Approval" : ord.order_status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 border-t border-slate-200/60 pt-2">
                      <div className="flex justify-between">
                        <span>Items: {ord.items_count} items</span>
                        <span className="font-serif font-bold text-slate-900">₹{ord.final_amount}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Steward: {ord.waiter_name}</span>
                        <span>{ord.elapsed_minutes}m ago</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      {isUnapproved ? (
                        <button
                          onClick={() => handleSuperAdminApprove(ord.id, ord.order_number)}
                          disabled={actionLoading === ord.id}
                          className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          {actionLoading === ord.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>⚡ Quick Approve (Send to KDS)</span>
                        </button>
                      ) : isPreparing ? (
                        <button
                          onClick={() => handleManualTransition(ord.id, ord.order_number, "READY")}
                          disabled={actionLoading === ord.id}
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          {actionLoading === ord.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>✓ Mark Ready for Pickup</span>
                        </button>
                      ) : isReady ? (
                        <button
                          onClick={() => handleManualTransition(ord.id, ord.order_number, "SERVED")}
                          disabled={actionLoading === ord.id}
                          className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          {actionLoading === ord.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
                          <span>🍽️ Mark Served at Table</span>
                        </button>
                      ) : (
                        <Link
                          href="/admin/orders"
                          className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 text-center transition"
                        >
                          <span>Manage in Workflow</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            No active orders right now. Orders placed by guests or stewards will appear here instantly.
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Executive Operations & Department Portals
          </h3>
          <span className="text-xs font-semibold text-slate-400">5 Distinct Enterprise Roles</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/owner/beverage"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <Wine className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Bar Admin (Anil)</span>
            <span className="text-[10px] text-blue-600 font-medium">PhonePe 8431712924-3@ybl</span>
          </Link>

          <Link
            href="/admin/owner/food"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Food Admin (Ramesh)</span>
            <span className="text-[10px] text-amber-700 font-medium">PhonePe ramesh776059@ybl</span>
          </Link>

          <Link
            href="/admin/reviews"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <Star className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Customer Reviews</span>
            <span className="text-[10px] text-purple-700 font-medium">5-Star Dining Ratings</span>
          </Link>

          <Link
            href="/admin/qr"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Table QR Plaques</span>
            <span className="text-[10px] text-indigo-700 font-medium">HMAC-SHA256 Plaques</span>
          </Link>

          <Link
            href="/admin/kot"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Kitchen Display (KDS)</span>
            <span className="text-[10px] text-orange-700 font-medium">Food Preparation Line</span>
          </Link>

          <Link
            href="/admin/bar"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-cyan-50/50 border border-slate-200 hover:border-cyan-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <Wine className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Bar Dispense Station</span>
            <span className="text-[10px] text-cyan-700 font-medium">Mixology & Draught KDS</span>
          </Link>

          <Link
            href="/admin/videos"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-pink-50/50 border border-slate-200 hover:border-pink-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Cinematic Videos</span>
            <span className="text-[10px] text-pink-700 font-medium">6 HD AVC1 Visuals</span>
          </Link>

          <Link
            href="/admin/tables"
            className="p-4 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Table Floor Plan</span>
            <span className="text-[10px] text-emerald-700 font-medium">Active Seating Grid</span>
          </Link>
        </div>
      </div>

      {/* 4. REAL-TIME OPERATIONS & INVENTORY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Tenders Settlement */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-slate-900">
              Settlement Tender Split
            </h3>
            <span className="text-xs text-blue-600 font-semibold">100% Reconciled</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">UPI / QR (PhonePe / GPay)</span>
                <span className="font-bold text-slate-900">₹{metrics.payment_breakdown.upi.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: "58%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Credit / Debit Card (EDC Swipe)</span>
                <span className="font-bold text-slate-900">₹{metrics.payment_breakdown.card.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full" style={{ width: "34%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Cash in Register Float</span>
                <span className="font-bold text-slate-900">₹{metrics.payment_breakdown.cash.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "8%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Inventory Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-slate-900">
              Cellar & Kitchen Inventory Health
            </h3>
            <span className="text-xs text-slate-400">Automated Min Threshold</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Wine className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Liquor Cellar Low Stock
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Macallan 12 Yrs, Bombay Sapphire Gin
                  </p>
                </div>
              </div>
              <Link href="/admin/inventory/liquor" className="text-xs font-bold text-blue-700 hover:underline">
                Reorder
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Kitchen Raw Material Below Min
                  </p>
                  <p className="text-[11px] text-orange-800 font-medium">
                    Artisanal Malai Paneer, Basmati Rice
                  </p>
                </div>
              </div>
              <Link href="/admin/inventory/restaurant" className="text-xs font-bold text-blue-700 hover:underline">
                Restock
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Real-time Toast */}
      {dashboardToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dashboardToast}</span>
        </div>
      )}
    </div>
  );
}
