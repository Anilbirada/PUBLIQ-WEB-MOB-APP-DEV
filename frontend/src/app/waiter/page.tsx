"use client";

import React, { useState, useEffect } from "react";
import { 
  Smartphone, Utensils, QrCode, Clock, CheckCircle2, AlertTriangle, 
  Search, Plus, Minus, UserCheck, ShieldAlert, ArrowRight, X, RefreshCw,
  CreditCard, Banknote, Split, Send, Bell, Download
} from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function WaiterMobileApp() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [waiter, setWaiter] = useState<any | null>(null);
  const [pin, setPin] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "tables" | "qr_orders" | "tracking" | "billing" | "menu">("dashboard");

  // Operational states
  const [metrics, setMetrics] = useState<any>({
    total_tables: 16,
    available_tables: 16,
    occupied_tables: 0,
    pending_approval: 0,
    preparing_orders: 0,
    ready_to_serve: 0,
    pending_bills: 0
  });

  const [tables, setTables] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [livePrepOrders, setLivePrepOrders] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  // Manual POS State
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<{ [id: string]: { item: any; quantity: number } }>({});
  const [posTableNumber, setPosTableNumber] = useState<string>("01");

  // Billing State
  const [billTableNum, setBillTableNum] = useState<string>("01");
  const [billPreview, setBillPreview] = useState<any | null>(null);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [qrPayload, setQrPayload] = useState<any | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showSplitModal, setShowSplitModal] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(2);

  // Manager call state
  const [showManagerModal, setShowManagerModal] = useState<boolean>(false);
  const [managerReason, setManagerReason] = useState<string>("VIP Guest assistance requested");
  const [managerNotice, setManagerNotice] = useState<string>("");

  // Polling data
  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Dashboard metrics
      const dashRes = await fetch(`${API_BASE}/waiter/dashboard`, { headers });
      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.summary) setMetrics(d.summary);
      }

      // 2. Tables
      const tblRes = await fetch(`${API_BASE}/waiter/tables`, { headers });
      if (tblRes.ok) {
        const tblData = await tblRes.json();
        setTables(tblData);
      }

      // 3. Pending QR orders
      const qrRes = await fetch(`${API_BASE}/waiter/orders/pending-approval`, { headers });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setPendingOrders(qrData);
      }

      // 4. Live Prep
      const prepRes = await fetch(`${API_BASE}/waiter/orders/live-prep`, { headers });
      if (prepRes.ok) {
        const prepData = await prepRes.json();
        setLivePrepOrders(prepData);
      }
    } catch (e) {
      console.warn("Polling error:", e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchMenu();
      const interval = setInterval(fetchData, 4000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        const all: any[] = [];
        data.forEach((cat: any) => {
          if (cat.items) {
            cat.items.forEach((it: any) => all.push({ ...it, cat_name: cat.name }));
          }
        });
        setMenuItems(all);
      }
    } catch (e) {
      console.warn("Failed menu load:", e);
    }
  };

  // Auth handler
  const handlePinSubmit = async (pinCode: string) => {
    setIsLoggingIn(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/waiter/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin_code: pinCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }
      setToken(data.access_token);
      setWaiter(data.employee);
    } catch (err: any) {
      setAuthError(err.message || "Invalid Employee PIN");
      setPin("");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick Demo Login
  const handleDemoLogin = () => {
    setPin("6666");
    handlePinSubmit("6666");
  };

  // Numpad handler
  const handleNumpad = (char: string) => {
    if (char === "C") {
      setPin("");
    } else if (char === "⌫") {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const next = pin + char;
      setPin(next);
      if (next.length === 4) {
        handlePinSubmit(next);
      }
    }
  };

  // Accept QR Order
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${orderId}/accept`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ waiter_name: waiter?.name || "Steward Raju" })
      });
      if (res.ok) {
        fetchData();
        alert("Order approved and dispatched to Kitchen KDS and Bar Station.");
      }
    } catch (e) {
      alert("Failed to accept order.");
    }
  };

  // Reject QR Order
  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt("Enter rejection reason (e.g. 86'd / kitchen full):", "Item currently unavailable");
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${orderId}/reject`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ waiter_name: waiter?.name, reason })
      });
      if (res.ok) {
        fetchData();
        alert("Order rejected.");
      }
    } catch (e) {
      alert("Failed to reject order.");
    }
  };

  // Mark Order Served
  const handleMarkServed = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${orderId}/serve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ waiter_name: waiter?.name })
      });
      if (res.ok) {
        fetchData();
        alert("Order marked as SERVED. Ready for billing.");
      }
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  // Manual POS Cart
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev[item.id];
      const qty = existing ? existing.quantity + 1 : 1;
      return { ...prev, [item.id]: { item, quantity: qty } };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        if (next[itemId].quantity > 1) {
          next[itemId].quantity -= 1;
        } else {
          delete next[itemId];
        }
      }
      return next;
    });
  };

  const cartSubtotal = Object.values(cart).reduce((acc, c) => acc + (c.item.base_price * c.quantity), 0);
  const cartGST = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const cartGrandTotal = cartSubtotal + cartGST;

  const handleDispatchManualOrder = async () => {
    const items = Object.values(cart).map(c => ({
      item_id: c.item.id,
      item_name: c.item.name,
      quantity: c.quantity,
      unit_price: c.item.base_price,
      is_alcohol: c.item.is_alcohol
    }));

    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/waiter/orders/manual`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: posTableNumber,
          waiter_name: waiter?.name || "Service Steward",
          items
        })
      });
      if (res.ok) {
        setCart({});
        fetchData();
        alert(`Order created for Table ${posTableNumber}! Dispatched to Kitchen & Bar.`);
        setActiveTab("tracking");
      }
    } catch (e) {
      alert("Failed to create order.");
    }
  };

  // Billing Fetch
  const fetchBillForTable = async (tNum: string) => {
    setBillTableNum(tNum);
    try {
      const res = await fetch(`${API_BASE}/waiter/bills/preview/${tNum}?discount_pct=${discountPct}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setBillPreview(d);
      } else {
        setBillPreview(null);
      }
    } catch (e) {
      setBillPreview(null);
    }
  };

  useEffect(() => {
    if (token && activeTab === "billing") {
      fetchBillForTable(billTableNum);
    }
  }, [billTableNum, discountPct, activeTab]);

  // Generate UPI QR
  const handleGenerateUPIQR = async () => {
    if (!billPreview) return;
    try {
      const res = await fetch(`${API_BASE}/waiter/payments/generate-qr`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: billTableNum,
          amount: billPreview.grand_total,
          order_id: billPreview.order_id
        })
      });
      if (res.ok) {
        const d = await res.json();
        setQrPayload(d);
        setShowQRModal(true);
      }
    } catch (e) {
      alert("Failed to generate payment QR.");
    }
  };

  // Settle Bill
  const handleSettle = async (mode: string) => {
    if (!billPreview) return;
    try {
      const res = await fetch(`${API_BASE}/waiter/payments/settle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: billTableNum,
          order_id: billPreview.order_id,
          payment_mode: mode,
          amount_paid: billPreview.grand_total,
          waiter_name: waiter?.name || "Service Steward"
        })
      });
      if (res.ok) {
        const d = await res.json();
        setShowQRModal(false);
        setShowSplitModal(false);
        fetchData();
        setBillPreview(null);
        alert(`Bill ${d.bill_number} settled via ${mode}!\nTable ${billTableNum} is now available.`);
        setActiveTab("tables");
      }
    } catch (e) {
      alert("Payment settlement failed.");
    }
  };

  // Manager Call
  const handleCallManager = async () => {
    try {
      const res = await fetch(`${API_BASE}/waiter/service/call-manager`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: posTableNumber || "Floor",
          waiter_name: waiter?.name || "Service Steward",
          reason: managerReason
        })
      });
      if (res.ok) {
        setShowManagerModal(false);
        setManagerNotice("Duty Manager has been notified on the master console.");
        setTimeout(() => setManagerNotice(""), 6000);
      }
    } catch (e) {
      alert("Failed to alert manager.");
    }
  };

  // If Not Authenticated -> Show Steward PIN Login Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-[#070B12] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#0D131F] border border-[#D4AF37]/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
          <img 
            src="/logo-transparent.png" 
            alt="PUBLIQ" 
            className="h-16 w-auto object-contain mb-2 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" 
          />

          <h1 className="text-xl font-bold tracking-[0.25em] text-[#D4AF37] uppercase">P U B L I Q   W</h1>
          <p className="text-xs text-slate-400 tracking-widest uppercase mt-1 mb-6 font-semibold">Service Staff Mobile App</p>

          <p className="text-xs text-slate-300 font-medium mb-3">Enter 4-Digit Employee PIN</p>

          {/* PIN Dots */}
          <div className="flex gap-4 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 border-[#D4AF37] transition-all duration-200 ${
                  pin.length > i ? "bg-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.5)]" : "bg-transparent"
                }`}
              />
            ))}
          </div>

          {authError && (
            <p className="text-xs text-rose-400 font-bold mb-4 bg-rose-950/40 border border-rose-800 px-3 py-1.5 rounded-lg text-center">
              {authError}
            </p>
          )}

          {/* Quick Ergonomic Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(k => (
              <button
                key={k}
                onClick={() => handleNumpad(k)}
                disabled={isLoggingIn}
                className="h-14 rounded-2xl bg-[#151F33] hover:bg-[#1E2B45] active:scale-95 text-lg font-bold text-white border border-slate-800 transition-all flex items-center justify-center shadow-md"
              >
                {k}
              </button>
            ))}
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37] text-xs font-bold text-[#D4AF37] tracking-wider transition-all mb-3"
          >
            {isLoggingIn ? "Authenticating..." : "⚡ Fast Demo: Steward Raju (PIN: 6666)"}
          </button>

          <a
            href="https://expo.dev/artifacts/eas/0tEy4gNp1r6i2bbAF47ANtKmnwe_PMZVBU8Tqlfw5Qk.apk"
            target="_blank"
            rel="noopener noreferrer"
            download="publiq-w.apk"
            className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download PUBLIQ W APK (83.2 MB)
          </a>
        </div>
      </div>
    );
  }

  // Authenticated Steward Viewport
  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex justify-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-[#090E17] min-h-screen flex flex-col border-x border-slate-800 shadow-2xl relative pb-20">
        
        {/* Top Operational Bar */}
        <div className="bg-[#0D131F] border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo-badge.png" alt="PUBLIQ" className="w-6 h-6 object-contain" />
              <span className="text-sm font-black tracking-widest text-[#D4AF37]">PUBLIQ W</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider">
              {waiter?.name} • Table Floor Active
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://expo.dev/artifacts/eas/0tEy4gNp1r6i2bbAF47ANtKmnwe_PMZVBU8Tqlfw5Qk.apk"
              target="_blank"
              rel="noopener noreferrer"
              download="publiq-w.apk"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900 flex items-center gap-1 shadow-sm"
              title="Download PUBLIQ W APK"
            >
              <Download className="w-3.5 h-3.5" />
              APK
            </a>
            <button
              onClick={() => setShowManagerModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-600/50 text-[10px] font-bold text-rose-300 hover:bg-rose-900 flex items-center gap-1 shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              CALL MGR
            </button>
            <button
              onClick={() => setToken(null)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60"
            >
              Logout
            </button>
          </div>
        </div>

        {managerNotice && (
          <div className="bg-amber-950/60 border-b border-amber-500/40 p-2 text-center text-xs text-amber-200 font-semibold flex items-center justify-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            {managerNotice}
          </div>
        )}

        {/* Dynamic Tab Views */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              {/* Urgent Action Banner */}
              {metrics.pending_approval > 0 && (
                <div 
                  onClick={() => setActiveTab("qr_orders")}
                  className="bg-amber-950/40 border border-amber-500/60 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-950/60 transition-all shadow-lg shadow-amber-950/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                    <div>
                      <p className="text-sm font-bold text-amber-300">{metrics.pending_approval} New Diner QR Orders</p>
                      <p className="text-[11px] text-slate-300">Review &amp; dispatch to Kitchen &amp; Bar</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400">REVIEW →</span>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div onClick={() => setActiveTab("tables")} className="bg-[#111927] border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-slate-700">
                  <p className="text-2xl font-black text-white">{metrics.occupied_tables}/{metrics.total_tables}</p>
                  <p className="text-xs font-bold text-slate-300 mt-1">Tables Seated</p>
                  <p className="text-[10px] text-slate-500">{metrics.available_tables} Available</p>
                </div>

                <div onClick={() => setActiveTab("qr_orders")} className={`bg-[#111927] border p-4 rounded-2xl cursor-pointer ${metrics.pending_approval > 0 ? "border-amber-500/60 bg-amber-950/20" : "border-slate-800"}`}>
                  <p className={`text-2xl font-black ${metrics.pending_approval > 0 ? "text-amber-400" : "text-white"}`}>{metrics.pending_approval}</p>
                  <p className="text-xs font-bold text-slate-300 mt-1">QR Approvals</p>
                  <p className="text-[10px] text-slate-500">Inbound Queue</p>
                </div>

                <div onClick={() => setActiveTab("tracking")} className="bg-[#111927] border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-slate-700">
                  <p className="text-2xl font-black text-blue-400">{metrics.preparing_orders}</p>
                  <p className="text-xs font-bold text-slate-300 mt-1">Cooking / Mixing</p>
                  <p className="text-[10px] text-slate-500">Kitchen &amp; Bar Prep</p>
                </div>

                <div onClick={() => setActiveTab("tracking")} className={`bg-[#111927] border p-4 rounded-2xl cursor-pointer ${metrics.ready_to_serve > 0 ? "border-emerald-500/60 bg-emerald-950/20" : "border-slate-800"}`}>
                  <p className="text-2xl font-black text-emerald-400">{metrics.ready_to_serve}</p>
                  <p className="text-xs font-bold text-slate-300 mt-1">Ready to Serve</p>
                  <p className="text-[10px] text-slate-500">Hot Dispatches</p>
                </div>
              </div>

              {/* Fast Floor Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="py-4 px-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] font-black text-xs tracking-wider flex flex-col items-center justify-center gap-1 shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-all"
                >
                  <span className="text-base font-black">+ NEW ORDER</span>
                  <span className="text-[10px] font-bold opacity-80">Manual Table Punch</span>
                </button>

                <button
                  onClick={() => setActiveTab("billing")}
                  className="py-4 px-3 rounded-2xl bg-[#151F33] border border-[#D4AF37]/50 text-[#D4AF37] font-black text-xs tracking-wider flex flex-col items-center justify-center gap-1 hover:bg-[#1A263D] active:scale-95 transition-all"
                >
                  <span className="text-base font-black">UPI QR BILL</span>
                  <span className="text-[10px] text-slate-300 font-normal">Exact Amount Scan</span>
                </button>
              </div>

              {/* Tables Awaiting Settlement */}
              <div 
                onClick={() => setActiveTab("tables")}
                className="bg-[#111927] border border-slate-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700"
              >
                <div>
                  <p className="text-xs font-bold text-white">{metrics.pending_bills} Tables Awaiting Settlement</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Collect Cash, Card, or Dynamic UPI QR</p>
                </div>
                <span className="text-xs font-bold text-[#D4AF37]">VIEW →</span>
              </div>
            </div>
          )}

          {/* TAB 2: TABLES FLOOR PLAN */}
          {activeTab === "tables" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">FLOOR PLAN ({tables.length} TABLES)</h2>
                <button onClick={fetchData} className="text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tables.map(t => {
                  const hasOrder = !!t.active_order;
                  return (
                    <div
                      key={t.id || t.table_number}
                      onClick={() => {
                        setSelectedTable(t);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                        hasOrder
                          ? "bg-[#131B2A] border-[#D4AF37]/60 shadow-md"
                          : t.is_occupied
                          ? "bg-slate-900 border-amber-600/40"
                          : "bg-[#0D131F] border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-white">T-{t.table_number}</span>
                        <span className="text-[10px] text-slate-400">👥 {t.capacity}</span>
                      </div>

                      <div className="my-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          t.status === "AVAILABLE" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" :
                          t.status === "READY_TO_SERVE" ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500" :
                          t.status === "PREPARING" ? "bg-blue-950/60 text-blue-300 border border-blue-800/40" :
                          "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                        }`}>
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {hasOrder ? (
                        <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-[#D4AF37]">₹{t.active_order.final_amount.toFixed(0)}</span>
                          <span className="text-[10px] text-slate-400">{t.active_order.items_count} items</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500">Tap to seat guest</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: QR INBOUND ORDERS */}
          {activeTab === "qr_orders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-widest text-amber-400 uppercase">DINER QR QUEUE ({pendingOrders.length})</h2>
                <button onClick={fetchData} className="text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="text-center py-16 bg-[#0D131F] rounded-2xl border border-slate-800">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">All Clear</p>
                  <p className="text-xs text-slate-400 mt-1">No customer QR orders currently waiting for approval.</p>
                </div>
              ) : (
                pendingOrders.map(order => (
                  <div key={order.order_id} className="bg-[#0F1626] border border-[#D4AF37] rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-base font-black text-[#D4AF37]">TABLE {order.table_number}</span>
                        <p className="text-[10px] font-mono text-slate-400">{order.order_number}</p>
                      </div>
                      <span className="text-lg font-black text-white">₹{order.final_amount.toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Guest: <span className="font-semibold text-white">{order.customer_name}</span> {order.customer_phone ? `(${order.customer_phone})` : ""}
                    </p>

                    {order.special_instructions && (
                      <div className="bg-amber-950/40 border-l-2 border-amber-500 p-2 rounded text-[11px] text-amber-300 font-medium">
                        Note: {order.special_instructions}
                      </div>
                    )}

                    {/* Food Items */}
                    {order.food_items && order.food_items.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🍳 Kitchen Dishes ({order.food_items.length})</p>
                        {order.food_items.map((fi: any) => (
                          <div key={fi.id} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-slate-200"><span className="text-[#D4AF37] font-bold">{fi.quantity}x</span> {fi.item_name}</span>
                            <span className="text-slate-400">₹{fi.total_price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bar Items */}
                    {order.bar_items && order.bar_items.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-800">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">🍸 Bar &amp; Cocktails ({order.bar_items.length})</p>
                        {order.bar_items.map((bi: any) => (
                          <div key={bi.id} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-slate-200"><span className="text-blue-400 font-bold">{bi.quantity}x</span> {bi.item_name}</span>
                            <span className="text-slate-400">₹{bi.total_price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Approval Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleRejectOrder(order.order_id)}
                        className="py-2.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-bold hover:bg-rose-900/60"
                      >
                        REJECT
                      </button>

                      <button
                        onClick={() => handleAcceptOrder(order.order_id)}
                        className="py-2.5 rounded-xl bg-[#D4AF37] text-[#070B12] text-xs font-black tracking-wider hover:opacity-95 shadow-md shadow-[#D4AF37]/20"
                      >
                        ACCEPT &amp; DISPATCH
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: KDS & BAR LIVE TRACKING */}
          {activeTab === "tracking" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">PREP TRACKER &amp; SERVING</h2>
                <button onClick={fetchData} className="text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {livePrepOrders.length === 0 ? (
                <div className="text-center py-16 bg-[#0D131F] rounded-2xl border border-slate-800">
                  <Utensils className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No Orders in Preparation</p>
                  <p className="text-xs text-slate-400 mt-1">All kitchen and bar tickets have been served.</p>
                </div>
              ) : (
                livePrepOrders.map(ord => (
                  <div key={ord.order_id} className={`p-4 rounded-2xl border space-y-3 ${ord.status === "READY" ? "bg-[#101A29] border-emerald-500" : "bg-[#0D131F] border-slate-800"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-[#D4AF37]">TABLE {ord.table_number}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{ord.order_number}</p>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${ord.is_delayed ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-slate-800 text-slate-300"}`}>
                          ⏱ {ord.elapsed_minutes}m elapsed
                        </span>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1">{ord.status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#151F33] p-2.5 rounded-xl text-[11px]">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Kitchen KDS</span>
                        <span className="text-white font-semibold">{ord.food_status}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Bar Dispense</span>
                        <span className="text-white font-semibold">{ord.beverage_status}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {ord.items.map((it: any) => (
                        <div key={it.id} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-slate-200"><span className="text-[#D4AF37] font-bold">{it.quantity}x</span> {it.item_name}</span>
                          <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{it.station}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setBillTableNum(ord.table_number);
                          setActiveTab("billing");
                        }}
                        className="py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
                      >
                        VIEW BILL
                      </button>

                      <button
                        onClick={() => handleMarkServed(ord.order_id)}
                        className="py-2.5 rounded-xl bg-emerald-500 text-[#070B12] text-xs font-black tracking-wider hover:opacity-95"
                      >
                        ✓ MARK SERVED
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: MANUAL STEWARD POS */}
          {activeTab === "menu" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D4AF37]">TABLE:</span>
                <input 
                  type="text" 
                  value={posTableNumber} 
                  onChange={e => setPosTableNumber(e.target.value)} 
                  className="w-16 px-2 py-1 bg-[#151F33] border border-[#D4AF37]/50 rounded text-center text-sm font-bold text-white" 
                />
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search dishes or drinks..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151F33] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-bold ${
                    selectedCategory === "all" ? "bg-[#D4AF37] text-black" : "bg-[#151F33] text-slate-300"
                  }`}
                >
                  ALL
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-bold ${
                      selectedCategory === c.id ? "bg-[#D4AF37] text-black" : "bg-[#151F33] text-slate-300"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Item List */}
              <div className="space-y-2 max-h-[46vh] overflow-y-auto">
                {menuItems
                  .filter(it => (selectedCategory === "all" || it.category_id === selectedCategory) && it.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(it => {
                    const inCart = cart[it.id];
                    return (
                      <div key={it.id} className="p-3 bg-[#0D131F] border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{it.name}</p>
                          <p className="text-[11px] text-[#D4AF37]">₹{it.base_price} • {it.is_alcohol ? "🍸 Bar" : "🍳 Kitchen"}</p>
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-2 bg-[#151F33] border border-[#D4AF37]/50 rounded-lg p-1">
                            <button onClick={() => removeFromCart(it.id)} className="w-6 h-6 flex items-center justify-center text-[#D4AF37] font-bold">-</button>
                            <span className="text-xs font-black text-white w-4 text-center">{inCart.quantity}</span>
                            <button onClick={() => addToCart(it)} className="w-6 h-6 flex items-center justify-center text-[#D4AF37] font-bold">+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(it)}
                            className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37] text-[#D4AF37] text-xs font-bold rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all"
                          >
                            + ADD
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Checkout Bar */}
              {Object.keys(cart).length > 0 && (
                <div className="bg-[#151F33] border border-[#D4AF37] p-3 rounded-2xl flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-[11px] text-slate-300">{Object.values(cart).reduce((a, c) => a + c.quantity, 0)} Items for Table {posTableNumber}</p>
                    <p className="text-sm font-black text-white">₹{cartGrandTotal.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">(5% GST incl.)</span></p>
                  </div>
                  <button
                    onClick={handleDispatchManualOrder}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-black text-xs font-black tracking-wider shadow-lg active:scale-95"
                  >
                    DISPATCH ORDER
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: BILLING & DYNAMIC UPI QR */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">INVOICE &amp; UPI QR SETTLEMENT</h2>
              </div>

              {/* Table Picker */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {["01", "02", "03", "04", "05", "06", "07", "08"].map(t => (
                  <button
                    key={t}
                    onClick={() => fetchBillForTable(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      billTableNum === t
                        ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                        : "bg-[#0D131F] text-slate-300 border-slate-800"
                    }`}
                  >
                    T-{t}
                  </button>
                ))}
              </div>

              {!billPreview ? (
                <div className="text-center py-12 bg-[#0D131F] rounded-2xl border border-slate-800">
                  <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No Unsettled Order on Table {billTableNum}</p>
                  <p className="text-xs text-slate-400 mt-1">Select an occupied table with an active dine-in session.</p>
                </div>
              ) : (
                <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#D4AF37]">PUBLIQ BAR &amp; RESTAURANT</p>
                      <p className="text-[10px] text-slate-400 font-mono">5% GST Non-ITC • SAC 996331</p>
                    </div>
                    <span className="text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                      TABLE {billTableNum}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {billPreview.items.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-xs py-0.5">
                        <span className="text-slate-200"><span className="text-[#D4AF37] font-bold">{it.quantity}x</span> {it.item_name}</span>
                        <span className="text-slate-300 font-medium">₹{it.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Staff Discount */}
                  <div className="flex items-center justify-between bg-[#151F33] p-2.5 rounded-xl text-xs">
                    <span className="text-slate-300">Staff Courtesy Discount:</span>
                    <div className="flex gap-1.5">
                      {[0, 5, 10, 15].map(d => (
                        <button
                          key={d}
                          onClick={() => setDiscountPct(d)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            discountPct === d ? "bg-[#D4AF37] text-black" : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculation Box */}
                  <div className="bg-[#151F33] p-3 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{billPreview.subtotal.toFixed(2)}</span>
                    </div>
                    {discountPct > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Discount ({discountPct}%)</span>
                        <span>-₹{billPreview.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>CGST (2.5%)</span>
                      <span>₹{billPreview.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>SGST (2.5%)</span>
                      <span>₹{billPreview.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-[#D4AF37] pt-2 border-t border-slate-700">
                      <span>TOTAL PAYABLE</span>
                      <span>₹{billPreview.grand_total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Primary Payment Action: Exact UPI QR */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleGenerateUPIQR}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-black text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      GENERATE DYNAMIC UPI QR (₹{billPreview.grand_total.toFixed(2)})
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSettle("CASH")}
                        className="py-2.5 rounded-xl bg-[#151F33] border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800"
                      >
                        💵 RECORD CASH
                      </button>

                      <button
                        onClick={() => handleSettle("CARD")}
                        className="py-2.5 rounded-xl bg-[#151F33] border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800"
                      >
                        💳 RECORD CARD
                      </button>
                    </div>

                    <button
                      onClick={() => setShowSplitModal(true)}
                      className="w-full py-2 text-center text-xs text-[#D4AF37] hover:underline font-semibold"
                    >
                      Split Bill Calculator
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0A0F1A] border-t border-slate-800 flex justify-around py-2.5 px-1 z-30 shadow-2xl">
          <button onClick={() => setActiveTab("dashboard")} className={`flex flex-col items-center gap-1 ${activeTab === "dashboard" ? "text-[#D4AF37]" : "text-slate-400"}`}>
            <span className="text-base">🏛️</span>
            <span className="text-[9px] font-black tracking-wider">HOME</span>
          </button>

          <button onClick={() => setActiveTab("tables")} className={`flex flex-col items-center gap-1 ${activeTab === "tables" ? "text-[#D4AF37]" : "text-slate-400"}`}>
            <span className="text-base">🪑</span>
            <span className="text-[9px] font-black tracking-wider">TABLES</span>
          </button>

          <button onClick={() => setActiveTab("qr_orders")} className={`flex flex-col items-center gap-1 relative ${activeTab === "qr_orders" ? "text-[#D4AF37]" : "text-slate-400"}`}>
            <span className="text-base">📲</span>
            {metrics.pending_approval > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                {metrics.pending_approval}
              </span>
            )}
            <span className="text-[9px] font-black tracking-wider">QR QUEUE</span>
          </button>

          <button onClick={() => setActiveTab("tracking")} className={`flex flex-col items-center gap-1 relative ${activeTab === "tracking" ? "text-[#D4AF37]" : "text-slate-400"}`}>
            <span className="text-base">⏱️</span>
            {metrics.ready_to_serve > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center">
                {metrics.ready_to_serve}
              </span>
            )}
            <span className="text-[9px] font-black tracking-wider">KDS/BAR</span>
          </button>

          <button onClick={() => setActiveTab("menu")} className={`flex flex-col items-center gap-1 ${activeTab === "menu" ? "text-[#D4AF37]" : "text-slate-400"}`}>
            <span className="text-base">📝</span>
            <span className="text-[9px] font-black tracking-wider">+ORDER</span>
          </button>

          <button onClick={() => setActiveTab("billing")} className={`flex flex-col items-center gap-1 ${activeTab === "billing" ? "text-[#D4AF37]" : "text-slate-400"}`}>
            <span className="text-base">💳</span>
            <span className="text-[9px] font-black tracking-wider">BILLING</span>
          </button>
        </div>

        {/* Dynamic UPI Payment QR Modal */}
        {showQRModal && qrPayload && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-[#0D131F] border border-[#D4AF37] rounded-3xl p-6 shadow-2xl space-y-4 text-center">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-[#D4AF37] tracking-wider uppercase">GUEST PAYMENT UPI QR</span>
                <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div>
                <p className="text-2xl font-black text-white">{qrPayload.formatted_amount}</p>
                <p className="text-xs text-slate-400 mt-1">Table {qrPayload.table_number} • {qrPayload.order_number}</p>
              </div>

              {/* High Contrast QR Code Representation */}
              <div className="bg-white p-4 rounded-2xl mx-auto inline-block shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload.upi_string)}`}
                  alt="Dynamic NPCI UPI QR"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg">
                VPA: {qrPayload.vpa}
              </div>

              <div className="flex justify-center gap-2 text-[10px] text-slate-400 font-bold">
                <span className="bg-[#151F33] px-2 py-1 rounded">Google Pay</span>
                <span className="bg-[#151F33] px-2 py-1 rounded">PhonePe</span>
                <span className="bg-[#151F33] px-2 py-1 rounded">Paytm</span>
                <span className="bg-[#151F33] px-2 py-1 rounded">BHIM</span>
              </div>

              <button
                onClick={() => handleSettle("UPI")}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-[#070B12] text-xs font-black tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/20"
              >
                ✓ GUEST PAID VIA UPI (CLOSE BILL)
              </button>
            </div>
          </div>
        )}

        {/* Split Bill Modal */}
        {showSplitModal && billPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-[#0D131F] border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#D4AF37] uppercase">SPLIT BILL: TABLE {billTableNum}</span>
                <button onClick={() => setShowSplitModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-sm font-bold text-white">Total Bill: ₹{billPreview.grand_total.toFixed(2)}</p>

              <div>
                <span className="text-xs text-slate-400 block mb-2">Number of Guests:</span>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setSplitCount(n)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                        splitCount === n ? "bg-[#D4AF37] text-black" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#151F33] p-4 rounded-xl text-center border border-[#D4AF37]/40">
                <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider block">EACH GUEST PAYS:</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  ₹{(billPreview.grand_total / splitCount).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setShowSplitModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                DONE
              </button>
            </div>
          </div>
        )}

        {/* Call Manager Modal */}
        {showManagerModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-[#0D131F] border border-rose-600 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-rose-400 uppercase tracking-wider">CALL DUTY MANAGER</span>
                <button onClick={() => setShowManagerModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-300">Select reason to notify manager immediately on master console:</p>

              <div className="space-y-2">
                {[
                  "VIP Guest assistance requested",
                  "Staff courtesy discount / comp approval",
                  "Allergy / culinary query",
                  "Billing discrepancy query"
                ].map(r => (
                  <button
                    key={r}
                    onClick={() => setManagerReason(r)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all ${
                      managerReason === r ? "bg-rose-950/80 border border-rose-500 text-rose-200" : "bg-[#151F33] text-slate-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCallManager}
                className="w-full py-3 rounded-xl bg-rose-600 text-white text-xs font-black tracking-wider hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                DISPATCH MANAGER ALERT
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
