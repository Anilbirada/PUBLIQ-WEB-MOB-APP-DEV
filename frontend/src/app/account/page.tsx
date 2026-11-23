"use client";

import React, { useState, useEffect } from "react";
import { 
  Phone, Clock, Search, Filter, ShoppingBag, CheckCircle2, 
  AlertCircle, ChevronRight, FileText, Utensils, Wine, ShieldCheck,
  Calendar, ArrowRight, RefreshCw, Receipt, CreditCard, Sparkles, User
} from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function AccountOrdersPage() {
  const [phone, setPhone] = useState<string>("");
  const [otp, setOtp] = useState<string>("123456");
  const [step, setStep] = useState<"ENTER_PHONE" | "ENTER_OTP" | "VIEW_ORDERS">("ENTER_PHONE");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Orders Data
  const [customerName, setCustomerName] = useState<string>("");
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);

  // Filters
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [searchOrderId, setSearchOrderId] = useState<string>("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<"ALL" | "FOOD" | "BEVERAGE">("ALL");

  // Check if phone was stored in localStorage from recent dining
  useEffect(() => {
    const savedPhone = localStorage.getItem("publiq_customer_phone");
    if (savedPhone) {
      setPhone(savedPhone);
      fetchOrdersForPhone(savedPhone, "all", "");
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const clean = phone.replace("+91", "").replace(/\s+/g, "").replace(/-/g, "");
    if (clean.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customers/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean })
      });
      const data = await res.json();
      if (res.ok) {
        setStep("ENTER_OTP");
        setSuccessMsg(data.message || "OTP verification code sent.");
        if (data.otp_debug) setOtp(data.otp_debug);
      } else {
        setErrorMsg(data.detail || "Unable to send verification code.");
      }
    } catch (_) {
      // Auto-fallback: directly retrieve orders
      fetchOrdersForPhone(clean, timeFilter, searchOrderId);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const clean = phone.replace("+91", "").replace(/\s+/g, "").replace(/-/g, "");
    try {
      const res = await fetch(`${API_BASE}/customers/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean, otp })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("publiq_customer_phone", clean);
        if (data.access_token) {
          localStorage.setItem("publiq_token", data.access_token);
        }
        await fetchOrdersForPhone(clean, timeFilter, searchOrderId);
      } else {
        setErrorMsg(data.detail || "Invalid OTP code.");
      }
    } catch (_) {
      await fetchOrdersForPhone(clean, timeFilter, searchOrderId);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersForPhone = async (phoneNum: string, tFilter: string, orderQuery: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const clean = phoneNum.replace("+91", "").replace(/\s+/g, "").replace(/-/g, "");
      let url = `${API_BASE}/customers/orders/by-phone?phone=${encodeURIComponent(clean)}&time_filter=${tFilter}`;
      if (orderQuery.trim()) {
        url += `&order_id=${encodeURIComponent(orderQuery.trim())}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomerName(data.customer_name || "Valued Diner");
        setActiveOrders(data.active_orders || []);
        setPreviousOrders(data.previous_orders || []);
        setTotalFound(data.total_orders_found || 0);
        setStep("VIEW_ORDERS");
        localStorage.setItem("publiq_customer_phone", clean);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Unable to load order history.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (newTimeFilter: string) => {
    setTimeFilter(newTimeFilter);
    const clean = phone.replace("+91", "").replace(/\s+/g, "").replace(/-/g, "");
    if (clean) {
      fetchOrdersForPhone(clean, newTimeFilter, searchOrderId);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace("+91", "").replace(/\s+/g, "").replace(/-/g, "");
    if (clean) {
      fetchOrdersForPhone(clean, timeFilter, searchOrderId);
    }
  };

  const handleSwitchNumber = () => {
    localStorage.removeItem("publiq_customer_phone");
    setStep("ENTER_PHONE");
    setActiveOrders([]);
    setPreviousOrders([]);
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Top Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-600" />
                CUSTOMER SELF-SERVICE PORTAL
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Verified Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              My Orders & Order History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Retrieve your active table dining session, view ordered food & drinks, track preparation status, and inspect past tax invoices using your registered mobile number.
            </p>
          </div>

          {step === "VIEW_ORDERS" && (
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 self-stretch sm:self-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{customerName}</p>
                  <p className="text-[10px] font-mono text-slate-500">+91 {phone.replace("+91", "").trim()}</p>
                </div>
              </div>
              <button
                onClick={handleSwitchNumber}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* STEP 1: Enter Mobile Number */}
        {step === "ENTER_PHONE" && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm max-w-lg mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Phone className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Enter Registered Mobile Number</h2>
              <p className="text-xs text-slate-500">
                We will look up all active dine-in orders and complete billing history associated with your number.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="97417 44886"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all bg-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Retrieve My Orders</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Verify OTP */}
        {step === "ENTER_OTP" && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm max-w-lg mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Verify Mobile Number</h2>
              <p className="text-xs text-slate-500">
                Enter the 6-digit verification code sent to <strong className="text-slate-800">+91 {phone}</strong>
              </p>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                />
                <p className="text-[11px] text-slate-500 text-center mt-1.5">
                  Use standard test code: <span className="font-mono font-bold text-slate-800">123456</span>
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("ENTER_PHONE")}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify & View Order History"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Display Orders & Complete History */}
        {step === "VIEW_ORDERS" && (
          <div className="space-y-8">
            
            {/* Search and Time Filters Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Time Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {[
                  { id: "all", label: "All Records" },
                  { id: "today", label: "Today's Orders" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "last_7_days", label: "Last 7 Days" },
                  { id: "last_30_days", label: "Last 30 Days" },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => handleApplyFilter(tf.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      timeFilter === tf.id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Order ID Search */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Order ID / Number..."
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
                >
                  Search
                </button>
              </form>
            </div>

            {/* SECTION 1: Active Dining Orders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg font-serif font-bold text-slate-900">
                    Current Active Orders ({activeOrders.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500">Live Kitchen & Bar Sync</span>
              </div>

              {activeOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-700">No active orders right now.</p>
                  <p className="text-xs text-slate-500">
                    When you place an order via Table QR or Waiter, your live status will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {activeOrders.map((ord) => renderOrderCard(ord, true))}
                </div>
              )}
            </div>

            {/* SECTION 2: Previous Order History */}
            <div className="space-y-4 pt-4 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-bold text-slate-900">
                    Previous Order History ({previousOrders.length})
                  </h2>
                  <p className="text-xs text-slate-500">Complete historical records with statutory GST tax breakdown</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Immutable Archive</span>
                </div>
              </div>

              {previousOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-700">No past orders match your selected filter.</p>
                  <p className="text-xs text-slate-500">Try switching the time range to 'All Records'.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {previousOrders.map((ord) => renderOrderCard(ord, false))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );

  // Helper renderer for individual order cards
  function renderOrderCard(ord: any, isActive: boolean) {
    const isPaid = ord.payment_status === "PAID";
    const totalItems = (ord.food_items?.length || 0) + (ord.drink_items?.length || 0);

    return (
      <div
        key={ord.order_id}
        className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
      >
        {/* Card Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              {ord.table_number || "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Table {ord.table_number}
                </h3>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  #{ord.order_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{ord.order_date}</span>
                <span>•</span>
                <span>{ord.order_time}</span>
                <span>•</span>
                <span>{totalItems} items</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            {/* Food Status Badge */}
            {ord.food_status && ord.food_status !== "NOT_ORDERED" && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                ord.food_status === "SERVED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : ord.food_status === "READY"
                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                  : ord.food_status === "REJECTED"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
              }`}>
                <Utensils className="w-3 h-3" />
                Kitchen: {ord.food_status}
              </span>
            )}

            {/* Bar Status Badge */}
            {ord.beverage_status && ord.beverage_status !== "NOT_ORDERED" && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                ord.beverage_status === "SERVED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : ord.beverage_status === "READY"
                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                  : ord.beverage_status === "REJECTED"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-sky-50 text-sky-800 border-sky-200 animate-pulse"
              }`}>
                <Wine className="w-3 h-3" />
                Bar: {ord.beverage_status}
              </span>
            )}

            {/* Payment Status Badge */}
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1 ${
              isPaid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
              {ord.payment_status}
            </span>
          </div>
        </div>

        {/* Card Body: Items Breakdown */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Food Items */}
          {ord.food_items && ord.food_items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Food Items ({ord.food_items.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ord.food_items.map((it: any) => (
                  <div
                    key={it.id}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                      it.item_status === "REJECTED"
                        ? "bg-rose-50/50 border-rose-200 text-rose-900"
                        : "bg-slate-50/70 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{it.quantity}x</span>
                        <span className="font-semibold text-slate-800">{it.item_name}</span>
                      </div>
                      {it.variant_name && (
                        <p className="text-[10px] text-slate-500 pl-6">{it.variant_name}</p>
                      )}
                      {it.item_status === "REJECTED" && (
                        <p className="text-[10px] text-rose-700 font-bold pl-6 mt-0.5">
                          Unavailable: {it.rejection_reason || "Out of stock"}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      ₹{it.total_price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drink Items */}
          {ord.drink_items && ord.drink_items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Wine className="w-3.5 h-3.5 text-sky-600" />
                <span>Beverages & Cocktails ({ord.drink_items.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ord.drink_items.map((it: any) => (
                  <div
                    key={it.id}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                      it.item_status === "REJECTED"
                        ? "bg-rose-50/50 border-rose-200 text-rose-900"
                        : "bg-slate-50/70 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{it.quantity}x</span>
                        <span className="font-semibold text-slate-800">{it.item_name}</span>
                      </div>
                      {it.variant_name && (
                        <p className="text-[10px] text-slate-500 pl-6">{it.variant_name}</p>
                      )}
                      {it.item_status === "REJECTED" && (
                        <p className="text-[10px] text-rose-700 font-bold pl-6 mt-0.5">
                          Unavailable: {it.rejection_reason || "Cellar stock depleted"}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      ₹{it.total_price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Invoices Info (if generated) */}
          {ord.invoices && ord.invoices.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  Statutory Department Tax Invoices
                </span>
                <span className="text-[10px] text-slate-500 font-mono">5% GST Composition (SAC 996331)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ord.invoices.map((inv: any) => (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-700">{inv.invoice_number}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        inv.payment_status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {inv.payment_status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      Owner: <strong>{inv.owner_name}</strong> • UPI: <span className="font-mono">{inv.upi_id}</span>
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-bold text-slate-800">
                      <span>Total: ₹{inv.grand_total?.toFixed(2)}</span>
                      {inv.upi_reference && (
                        <span className="text-[9px] font-mono text-slate-500">UTR: {inv.upi_reference}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-500">
              {ord.food_subtotal > 0 && <span>Food: <strong>₹{ord.food_subtotal?.toFixed(2)}</strong></span>}
              {ord.beverage_subtotal > 0 && <span>Drinks: <strong>₹{ord.beverage_subtotal?.toFixed(2)}</strong></span>}
              <span>GST (5%): <strong>₹{((ord.cgst || 0) + (ord.sgst || 0)).toFixed(2)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Payable:</span>
              <span className="font-serif font-extrabold text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                ₹{ord.total_amount?.toFixed(2)}
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }
}
