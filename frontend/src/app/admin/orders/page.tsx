"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock, CheckCircle2, AlertCircle, RefreshCw, ShoppingCart, 
  Flame, Wine, UtensilsCrossed, Check, ArrowRight, X, AlertTriangle,
  Receipt, Search, Filter, ShieldCheck, ChevronRight, UserCheck
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { LiveClock } from "@/components/LiveClock";

export default function SuperAdminOrdersWorkflowPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/operations/orders/live-workflow`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn("Failed to load live workflow:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
    const interval = setInterval(fetchWorkflow, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchWorkflow();
      setToastMsg("Order workflow synced with Kitchen, Bar & Tables");
      setTimeout(() => setToastMsg(null), 2500);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
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
        setToastMsg(`✓ Order ${orderNumber} approved & dispatched to Kitchen and Bar`);
        setTimeout(() => setToastMsg(null), 3000);
        await fetchWorkflow();
      }
    } catch (_) {
      setToastMsg(`Error approving order ${orderNumber}`);
      setTimeout(() => setToastMsg(null), 2500);
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
          notes: `Super Admin manual progression to ${targetStatus}`
        })
      });
      if (res.ok) {
        setToastMsg(`✓ Order ${orderNumber} moved to ${targetStatus}`);
        setTimeout(() => setToastMsg(null), 3000);
        await fetchWorkflow();
      }
    } catch (_) {
      setToastMsg(`Error transitioning order ${orderNumber}`);
      setTimeout(() => setToastMsg(null), 2500);
    } finally {
      setActionLoading(null);
    }
  };

  const counts = data?.counts || {
    total_active: 0,
    pending_approval: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    payment_pending: 0,
    completed: 0
  };

  const allOrders = data?.all_orders || [];

  const filteredOrders = allOrders.filter((ord: any) => {
    // Stage Filter
    if (activeStage === "PENDING_APPROVAL") {
      if (ord.is_approved && ord.food_status !== "PENDING_APPROVAL" && ord.beverage_status !== "PENDING_APPROVAL" && ord.order_status !== "PLACED") return false;
    } else if (activeStage === "PREPARING") {
      if (!["ACCEPTED", "PREPARING"].includes(ord.order_status) && !["ACCEPTED", "PREPARING"].includes(ord.food_status) && !["ACCEPTED", "PREPARING"].includes(ord.beverage_status)) return false;
    } else if (activeStage === "READY") {
      if (ord.order_status !== "READY" && ord.food_status !== "READY" && ord.beverage_status !== "READY") return false;
    } else if (activeStage === "SERVED") {
      if (ord.order_status !== "SERVED") return false;
    } else if (activeStage === "PAYMENT_PENDING") {
      if (!["PENDING", "PAY_AT_COUNTER"].includes(ord.payment_status) || ord.order_status === "COMPLETED") return false;
    } else if (activeStage === "COMPLETED") {
      if (ord.order_status !== "COMPLETED" && ord.payment_status !== "PAID") return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = ord.order_number?.toLowerCase().includes(q);
      const matchTbl = ord.table_number?.toLowerCase().includes(q);
      const matchCust = ord.customer_name?.toLowerCase().includes(q);
      const matchItem = ord.items?.some((it: any) => it.item_name.toLowerCase().includes(q));
      return matchNum || matchTbl || matchCust || matchItem;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider text-blue-700 font-bold">
              SUPER ADMIN MASTER OPERATIONS • LIVE RESTAURANT WORKFLOW
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Lifecycle & Manual Workflow Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl font-medium">
            Complete end-to-end visibility across Guest Ordering, Waiter Floor, Kitchen KDS, Bar Dispense, and Cashier POS. 
            Super Admin can manually approve, advance, serve, or complete any order at any stage.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-right shadow-2xs">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Live Synchronized Time</p>
            <LiveClock variant="digital" showSeconds={true} showDate={false} className="bg-transparent border-0 p-0 shadow-none font-bold" />
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-xs flex items-center justify-center ${
              isRefreshing ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-95"
            }`}
            title="Refresh Order Workflow"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 transition-transform ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Order Workflow Pipeline Stage Tickers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {[
          { key: "ALL", label: "All Orders", count: counts.total_active + counts.completed, color: "text-slate-900", border: "border-slate-200", bg: "bg-white" },
          { key: "PENDING_APPROVAL", label: "1. Awaiting Approval", count: counts.pending_approval, color: "text-amber-700", border: "border-amber-300", bg: "bg-amber-50/60" },
          { key: "PREPARING", label: "2. Cooking / Bar Prep", count: counts.preparing, color: "text-blue-700", border: "border-blue-300", bg: "bg-blue-50/60" },
          { key: "READY", label: "3. Ready for Service", count: counts.ready, color: "text-emerald-700", border: "border-emerald-300", bg: "bg-emerald-50/60" },
          { key: "SERVED", label: "4. Dining at Table", count: counts.served, color: "text-indigo-700", border: "border-indigo-300", bg: "bg-indigo-50/60" },
          { key: "PAYMENT_PENDING", label: "5. Pending Settlement", count: counts.payment_pending, color: "text-rose-700", border: "border-rose-300", bg: "bg-rose-50/60" },
          { key: "COMPLETED", label: "6. Settled / Completed", count: counts.completed, color: "text-slate-700", border: "border-slate-300", bg: "bg-slate-50/80" },
        ].map((st) => (
          <button
            key={st.key}
            onClick={() => setActiveStage(st.key)}
            className={`p-4 rounded-2xl border text-left transition-all shadow-xs ${st.bg} ${st.border} ${
              activeStage === st.key ? "ring-2 ring-blue-600 shadow-sm" : "hover:shadow-md"
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block truncate">
              {st.label}
            </span>
            <span className={`font-serif text-2xl font-black mt-1 block ${st.color}`}>
              {st.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number, table (e.g. Table 01), customer, or item..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "PENDING_APPROVAL", "PREPARING", "READY", "SERVED", "PAYMENT_PENDING", "COMPLETED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStage(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeStage === tab 
                  ? "bg-slate-900 text-white shadow-2xs" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Live Orders List */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Retrieving Live Order Workflow...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-slate-900">No Orders in this Stage</h3>
          <p className="text-xs text-slate-500">All current orders are proceeding smoothly through subsequent operational stages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((ord: any) => {
            const isUnapproved = !ord.is_approved || ord.food_status === "PENDING_APPROVAL" || ord.beverage_status === "PENDING_APPROVAL";
            const isPreparing = ["ACCEPTED", "PREPARING"].includes(ord.order_status);
            const isReady = ord.order_status === "READY";
            const isServed = ord.order_status === "SERVED";
            const isPaymentPending = ["PENDING", "PAY_AT_COUNTER"].includes(ord.payment_status) && ord.order_status !== "COMPLETED";
            const isCompleted = ord.order_status === "COMPLETED" || ord.payment_status === "PAID";

            return (
              <div
                key={ord.id}
                className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all bg-white ${
                  isUnapproved 
                    ? "border-amber-400 ring-2 ring-amber-200/60" 
                    : isReady
                    ? "border-emerald-400 ring-1 ring-emerald-200"
                    : isPreparing
                    ? "border-blue-300"
                    : "border-slate-200"
                }`}
              >
                {/* Card Header */}
                <div className={`p-5 border-b border-slate-100 space-y-3 ${
                  isUnapproved 
                    ? "bg-amber-50/70" 
                    : isReady 
                    ? "bg-emerald-50/60" 
                    : isPreparing 
                    ? "bg-blue-50/50" 
                    : "bg-slate-50/70"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                        {ord.table_number.replace("Table ", "")}
                      </span>
                      <div>
                        <h3 className="font-serif font-bold text-base text-slate-900">{ord.table_number}</h3>
                        <p className="text-[11px] font-mono text-slate-500">#{ord.order_number}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-2xs ${
                        isUnapproved
                          ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                          : isReady
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : isPreparing
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : isServed
                          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                          : isCompleted
                          ? "bg-slate-100 text-slate-800 border-slate-300"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {isUnapproved ? "Awaiting Approval" : ord.order_status}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        {ord.elapsed_minutes}m ago
                      </p>
                    </div>
                  </div>

                  {/* Customer & Steward Info */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Guest: <strong className="text-slate-900">{ord.customer_name}</strong></span>
                    <span>Steward: <strong className="text-blue-700">{ord.waiter_name}</strong></span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="p-5 space-y-3 flex-1">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ord.items.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${it.department === "BEVERAGE" ? "bg-cyan-500" : "bg-amber-500"}`} />
                          <span className="font-medium">
                            {it.quantity}x {it.item_name} {it.variant_name ? `(${it.variant_name})` : ""}
                          </span>
                        </div>
                        <span className="font-serif font-bold text-slate-900">₹{it.total_price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals & Department Statuses */}
                  <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Kitchen Food Status:</span>
                      <span className="font-semibold text-slate-800">{ord.food_status}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Bar Beverage Status:</span>
                      <span className="font-semibold text-slate-800">{ord.beverage_status}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Payment Status:</span>
                      <span className={`font-semibold ${ord.payment_status === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>
                        {ord.payment_status} ({ord.payment_method})
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total Amount:</span>
                      <span className="font-serif text-base text-blue-700">₹{ord.final_amount}</span>
                    </div>
                  </div>
                </div>

                {/* Super Admin Action Controls */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-2">
                  {/* Primary Workflow Actions */}
                  {isUnapproved ? (
                    <button
                      onClick={() => handleSuperAdminApprove(ord.id, ord.order_number)}
                      disabled={actionLoading === ord.id}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {actionLoading === ord.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>⚡ Approve as Super Admin (Dispatch to KDS & Bar)</span>
                    </button>
                  ) : isPreparing ? (
                    <button
                      onClick={() => handleManualTransition(ord.id, ord.order_number, "READY")}
                      disabled={actionLoading === ord.id}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {actionLoading === ord.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>✓ Mark Cooked & Ready for Service</span>
                    </button>
                  ) : isReady ? (
                    <button
                      onClick={() => handleManualTransition(ord.id, ord.order_number, "SERVED")}
                      disabled={actionLoading === ord.id}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {actionLoading === ord.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
                      <span>🍽️ Mark Served to Table</span>
                    </button>
                  ) : isServed ? (
                    <div className="flex gap-2">
                      <Link
                        href="/admin/pos"
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Settle in POS</span>
                      </Link>
                      <button
                        onClick={() => handleManualTransition(ord.id, ord.order_number, "COMPLETED")}
                        disabled={actionLoading === ord.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        Complete Order
                      </button>
                    </div>
                  ) : null}

                  {/* Manual Override Controls */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500 font-medium">Manual Override:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleManualTransition(ord.id, ord.order_number, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                      className="py-1 px-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold text-[11px] focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                    >
                      <option value="" disabled>Force Stage...</option>
                      <option value="ACCEPTED">Force ACCEPTED</option>
                      <option value="PREPARING">Force PREPARING (Cooking)</option>
                      <option value="READY">Force READY (Pick-up)</option>
                      <option value="SERVED">Force SERVED (At Table)</option>
                      <option value="COMPLETED">Force COMPLETED (Paid)</option>
                      <option value="CANCELLED">Force CANCELLED (Void)</option>
                    </select>

                    <Link
                      href={`/order-confirmation/${ord.id}`}
                      target="_blank"
                      className="text-blue-700 hover:underline font-bold text-[11px] flex items-center gap-0.5"
                    >
                      <span>Receipt</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real-time Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
