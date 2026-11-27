"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp, ShoppingBag, Box, Users, ShoppingCart, Calendar,
  Download, Plus, ChevronDown, Sparkles, Lightbulb, UtensilsCrossed,
  Flame, Wine, Clock, ArrowUpRight, CheckCircle2, AlertCircle,
  RefreshCw, FileText, Check, X, Search, ChevronRight, Filter,
  ArrowUp, Award, Layers, DollarSign, Store, Bell, Eye, Printer,
  FileSpreadsheet, FileCode, Shield, Activity, UserCheck, ChefHat,
  GlassWater, ReceiptText, User
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const [greeting, setGreeting] = useState<string>("Good Morning");
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "waiters" | "kitchen_bar" | "billing" | "audit_logs">("overview");

  // Overview BI state
  const [biData, setBiData] = useState<any>(null);
  const [biLoading, setBiLoading] = useState<boolean>(true);
  const [trendTab, setTrendTab] = useState<"day" | "week" | "month" | "year">("day");
  const [selectedDate, setSelectedDate] = useState<string>("Today (IST)");
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab specific data states
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [loadingCustomerProfile, setLoadingCustomerProfile] = useState<boolean>(false);

  const [waitersData, setWaitersData] = useState<any[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<any | null>(null);
  const [waiterTimeline, setWaiterTimeline] = useState<any[]>([]);
  const [loadingWaiterTimeline, setLoadingWaiterTimeline] = useState<boolean>(false);

  const [foodAdminsData, setFoodAdminsData] = useState<any[]>([]);
  const [barAdminsData, setBarAdminsData] = useState<any[]>([]);

  const [billingData, setBillingData] = useState<any[]>([]);
  const [billingSearch, setBillingSearch] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const [auditLogsData, setAuditLogsData] = useState<any[]>([]);
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>("");
  const [auditSearch, setAuditSearch] = useState<string>("");

  // Modals & UI controls
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportType, setExportType] = useState<string>("overview");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx");
  const [showWorkflowSection, setShowWorkflowSection] = useState<boolean>(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(3);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Fetch Overview BI data
  const fetchOverviewData = async (period: string = trendTab) => {
    try {
      setBiLoading(true);
      const res = await fetch(`${API_BASE}/admin/bi/overview?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setBiData(json);
        if (json.filter?.label) {
          setSelectedDate(json.filter.label);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch BI overview, fallback will be used:", err);
    } finally {
      setBiLoading(false);
    }
  };

  // Fetch Workflow data
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

  // Fetch Customers History
  const fetchCustomers = async (search: string = customerSearch) => {
    try {
      const url = new URL(`${API_BASE}/admin/bi/customers`);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setCustomersData(json.customers || []);
      }
    } catch (err) {
      console.warn("Error fetching customers:", err);
    }
  };

  // Fetch Waiters Performance
  const fetchWaiters = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/bi/waiters?period=${trendTab}`);
      if (res.ok) {
        const json = await res.json();
        setWaitersData(json.waiters || []);
      }
    } catch (err) {
      console.warn("Error fetching waiters:", err);
    }
  };

  // Fetch Kitchen & Bar Staff
  const fetchKitchenAndBarStaff = async () => {
    try {
      const [foodRes, barRes] = await Promise.all([
        fetch(`${API_BASE}/admin/bi/food-admins?period=${trendTab}`),
        fetch(`${API_BASE}/admin/bi/bar-admins?period=${trendTab}`)
      ]);
      if (foodRes.ok) {
        const fJson = await foodRes.json();
        setFoodAdminsData(fJson.food_admins || []);
      }
      if (barRes.ok) {
        const bJson = await barRes.json();
        setBarAdminsData(bJson.bar_admins || []);
      }
    } catch (err) {
      console.warn("Error fetching staff history:", err);
    }
  };

  // Fetch Billing History
  const fetchBilling = async (search: string = billingSearch) => {
    try {
      const url = new URL(`${API_BASE}/admin/bi/billing`);
      url.searchParams.set("period", trendTab);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setBillingData(json.invoices || []);
      }
    } catch (err) {
      console.warn("Error fetching billing:", err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (role: string = auditRoleFilter, search: string = auditSearch) => {
    try {
      const url = new URL(`${API_BASE}/admin/bi/audit-logs`);
      if (role) url.searchParams.set("user_role", role);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setAuditLogsData(json.logs || []);
      }
    } catch (err) {
      console.warn("Error fetching audit logs:", err);
    }
  };

  // Initial and reactive data fetching
  useEffect(() => {
    fetchOverviewData(trendTab);
    fetchWorkflow();
    const interval = setInterval(fetchWorkflow, 8000);
    return () => clearInterval(interval);
  }, [trendTab]);

  useEffect(() => {
    if (activeTab === "customers") fetchCustomers();
    else if (activeTab === "waiters") fetchWaiters();
    else if (activeTab === "kitchen_bar") fetchKitchenAndBarStaff();
    else if (activeTab === "billing") fetchBilling();
    else if (activeTab === "audit_logs") fetchAuditLogs();
  }, [activeTab]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchOverviewData(trendTab),
      fetchWorkflow(),
      activeTab === "customers" ? fetchCustomers() : Promise.resolve(),
      activeTab === "waiters" ? fetchWaiters() : Promise.resolve(),
      activeTab === "kitchen_bar" ? fetchKitchenAndBarStaff() : Promise.resolve(),
      activeTab === "billing" ? fetchBilling() : Promise.resolve(),
      activeTab === "audit_logs" ? fetchAuditLogs() : Promise.resolve()
    ]);
    showToast("✓ All analytics and operational databases synchronized in IST");
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Drilldown: Customer Profile
  const openCustomerProfile = async (customerId: string) => {
    try {
      setLoadingCustomerProfile(true);
      const res = await fetch(`${API_BASE}/admin/bi/customers/${customerId}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedCustomer(json.customer);
      }
    } catch (err) {
      showToast("Could not load customer profile");
    } finally {
      setLoadingCustomerProfile(false);
    }
  };

  // Drilldown: Waiter Activity Timeline
  const openWaiterTimeline = async (waiter: any) => {
    setSelectedWaiter(waiter);
    try {
      setLoadingWaiterTimeline(true);
      const res = await fetch(`${API_BASE}/admin/bi/waiters/${waiter.waiter_id}/activity`);
      if (res.ok) {
        const json = await res.json();
        setWaiterTimeline(json.timeline || []);
      }
    } catch (err) {
      showToast("Could not load waiter timeline");
    } finally {
      setLoadingWaiterTimeline(false);
    }
  };

  // Handle Export Download
  const handleExport = (type: string, format: "csv" | "xlsx" | "pdf") => {
    const downloadUrl = `${API_BASE}/admin/bi/export?type=${type}&format=${format}&period=${trendTab}`;
    window.open(downloadUrl, "_blank");
    setShowExportModal(false);
    showToast(`✓ Generating ${format.toUpperCase()} export for ${type.replace('_', ' ')}...`);
  };

  // Data helpers for the 15 KPI Cards
  const kpis = biData?.kpis || {
    total_customers: 52,
    total_orders: 168,
    total_food_orders: 124,
    total_bar_orders: 86,
    total_bills_generated: 154,
    total_revenue: 32450.0,
    total_food_revenue: 21092.5,
    total_bar_revenue: 11357.5,
    average_bill_amount: 193.0,
    pending_orders: 17,
    completed_orders: 145,
    cancelled_orders: 6,
    total_waiters: 6,
    active_food_admins: 4,
    active_bar_admins: 3
  };

  // Trend Chart Calculation
  const trendSlots = biData?.trends?.slots || ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "11 PM"];
  const trendRevenue = biData?.trends?.revenue || [1200, 800, 1600, 5600, 4800, 5200, 3200];
  const trendOrders = biData?.trends?.orders || [6, 4, 12, 28, 22, 26, 16];
  const maxRevenue = Math.max(...trendRevenue, 1000);
  const maxOrders = Math.max(...trendOrders, 10);

  const chartW = 760;
  const chartH = 220;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 35;
  const padBottom = 30;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;
  const numPoints = trendSlots.length;

  const pointsRev = trendRevenue.map((val: number, i: number) => ({
    x: padLeft + (i / Math.max(1, numPoints - 1)) * plotW,
    y: padTop + plotH - (val / maxRevenue) * plotH,
    val
  }));

  const pointsOrd = trendOrders.map((val: number, i: number) => ({
    x: padLeft + (i / Math.max(1, numPoints - 1)) * plotW,
    y: padTop + plotH - (val / maxOrders) * plotH,
    val
  }));

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const pathRev = buildSmoothPath(pointsRev);
  const pathRevArea = `${pathRev} L ${pointsRev[pointsRev.length - 1]?.x || 0} ${padTop + plotH} L ${pointsRev[0]?.x || 0} ${padTop + plotH} Z`;
  const pathOrd = buildSmoothPath(pointsOrd);
  const pathOrdArea = `${pathOrd} L ${pointsOrd[pointsOrd.length - 1]?.x || 0} ${padTop + plotH} L ${pointsOrd[0]?.x || 0} ${padTop + plotH} Z`;

  const topFood = biData?.top_food || [
    { rank: 1, name: "Paneer Butter Masala", category: "Main Course", orders: 124, revenue: 6450, image: "/images/publiq/food/butter-chicken-copper-handi.webp" },
    { rank: 2, name: "Chicken Biryani", category: "Biryani & Rice", orders: 98, revenue: 5320, image: "/images/publiq/food/dum-biryani-hyderabadi.webp" },
    { rank: 3, name: "Veg Pizza", category: "Pizza", orders: 76, revenue: 4280, image: "/images/publiq/food/tandoori-mixed-grill.webp" },
    { rank: 4, name: "Masala Dosa", category: "South Indian", orders: 58, revenue: 3120, image: "/images/publiq/food/dal-saag-paneer-duo.webp" },
    { rank: 5, name: "Chocolate Lava Cake", category: "Desserts", orders: 38, revenue: 2280, image: "/images/publiq/food/chocolate-lava-cake-icecream.webp" }
  ];

  const topDrinks = biData?.top_drinks || [
    { rank: 1, name: "Classic Mojito", category: "Signature Cocktails", orders: 86, revenue: 4300, image: "/images/menu/cocktails.jpg" },
    { rank: 2, name: "Exotic Blue Lagoon", category: "Cocktails", orders: 64, revenue: 3520, image: "/images/menu/cocktails.jpg" },
    { rank: 3, name: "Fresh Watermelon Cooler", category: "Mocktails", orders: 52, revenue: 1820, image: "/images/menu/mocktails.jpg" },
    { rank: 4, name: "LIIT Long Island", category: "Cocktails", orders: 44, revenue: 3960, image: "/images/menu/cocktails.jpg" },
    { rank: 5, name: "Corona Extra Pint", category: "Beers", orders: 39, revenue: 2730, image: "/images/menu/beer.jpg" }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2.5 border border-slate-700 animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          1. TOP GREETING & ACTION CONTROLS HEADER
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{mounted ? greeting : "Good Morning"}, {mounted && user?.fullName ? user.fullName : "Chef Rohan"}!</span>
            <span className="inline-block animate-wiggle">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Here's what's happening with your food &amp; bar business today across all departments.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 transition-all shadow-xs cursor-pointer"
            title="Refresh Real-Time Business Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-600" : ""}`} />
          </button>

          {/* Date Selector Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-xs">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>{selectedDate}</span>
          </div>

          {/* Download Report Modal Trigger */}
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs shadow-orange-500/20 hover:shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. ENTERPRISE NAVIGATION TABS
      ======================================================== */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === "customers"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer History</span>
        </button>

        <button
          onClick={() => setActiveTab("waiters")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === "waiters"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Waiter Activity &amp; Performance</span>
        </button>

        <button
          onClick={() => setActiveTab("kitchen_bar")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === "kitchen_bar"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Kitchen &amp; Bar Staff</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === "billing"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>Billing &amp; Financial History</span>
        </button>

        <button
          onClick={() => setActiveTab("audit_logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === "audit_logs"
              ? "bg-orange-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Activity Audit Logs</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: EXECUTIVE DASHBOARD OVERVIEW (MODULE 1 & 6)
      ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 4 Hero KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Total Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-orange-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
                </div>
                <div className="w-20 h-7">
                  <svg viewBox="0 0 80 28" className="w-full h-full overflow-visible">
                    <path d="M 0 22 Q 20 8, 35 18 T 60 10 T 80 4" fill="none" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  ₹{Number(kpis.total_revenue).toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 8.2%</span>
                  <span className="text-slate-400 font-medium">vs Yesterday</span>
                </p>
              </div>
            </div>

            {/* 2. Total Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-orange-600 flex items-center justify-center">
                    <Box className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Total Orders</span>
                </div>
                <div className="w-20 h-7">
                  <svg viewBox="0 0 80 28" className="w-full h-full overflow-visible">
                    <path d="M 0 24 Q 25 20, 40 10 T 65 14 T 80 6" fill="none" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {kpis.total_orders}
                </div>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 6.2%</span>
                  <span className="text-slate-400 font-medium">vs Yesterday</span>
                </p>
              </div>
            </div>

            {/* 3. New Customers */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">New Customers</span>
                </div>
                <div className="w-20 h-7">
                  <svg viewBox="0 0 80 28" className="w-full h-full overflow-visible">
                    <path d="M 0 20 Q 20 22, 40 14 T 60 16 T 80 4" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {kpis.total_customers}
                </div>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 4.1%</span>
                  <span className="text-slate-400 font-medium">vs Yesterday</span>
                </p>
              </div>
            </div>

            {/* 4. Average Order Value */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Average Order Value</span>
                </div>
                <div className="w-20 h-7">
                  <svg viewBox="0 0 80 28" className="w-full h-full overflow-visible">
                    <path d="M 0 18 Q 20 24, 40 16 T 60 12 T 80 6" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  ₹{kpis.average_bill_amount}
                </div>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 3.7%</span>
                  <span className="text-slate-400 font-medium">vs Yesterday</span>
                </p>
              </div>
            </div>
          </div>

          {/* 11 Secondary Operational KPI Cards */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Department Operations &amp; Staff Headcount</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Food Orders</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.total_food_orders}</span>
                <span className="text-[10px] text-orange-600 font-semibold">Kitchen KOTs</span>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Bar Orders</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.total_bar_orders}</span>
                <span className="text-[10px] text-indigo-600 font-semibold">Mixology Tickets</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Food Revenue</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">₹{Number(kpis.total_food_revenue).toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Ramesh Food Business</span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Bar Revenue</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">₹{Number(kpis.total_bar_revenue).toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-blue-600 font-semibold">Anil Bar Business</span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Bills Generated</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.total_bills_generated}</span>
                <span className="text-[10px] text-purple-600 font-semibold">Official Invoices</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Active Waiters</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.total_waiters}</span>
                <span className="text-[10px] text-amber-600 font-semibold">Floor Stewards</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Active Food Admins</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.active_food_admins}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Chefs on Shift</span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Active Bar Admins</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.active_bar_admins}</span>
                <span className="text-[10px] text-blue-600 font-semibold">Bartenders on Shift</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Pending Orders</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.pending_orders}</span>
                <span className="text-[10px] text-amber-600 font-semibold">In Prep / Kitchen</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Completed Orders</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.completed_orders}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Served &amp; Paid</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Cancelled Orders</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{kpis.cancelled_orders}</span>
                <span className="text-[10px] text-rose-600 font-semibold">Rejections &bull; 3.6%</span>
              </div>
            </div>
          </div>

          {/* Revenue & Orders Trend (Dual Spline Line Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Revenue &amp; Orders Trend
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Hourly and daily sales comparison in Indian Standard Time (IST)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center p-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold">
                    <button
                      onClick={() => setTrendTab("day")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        trendTab === "day" ? "bg-orange-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setTrendTab("week")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        trendTab === "week" ? "bg-orange-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setTrendTab("month")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        trendTab === "month" ? "bg-orange-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => setTrendTab("year")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        trendTab === "year" ? "bg-orange-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Year
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-1 rounded-full bg-[#F97316]" />
                      <span>Revenue (₹)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-1 rounded-full bg-[#10B981]" />
                      <span>Orders</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="relative w-full h-60 select-none">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="areaOrdersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = padTop + pct * plotH;
                    return (
                      <g key={i}>
                        <line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600">
                          {Math.round(((1 - pct) * maxRevenue) / 1000)}k
                        </text>
                      </g>
                    );
                  })}

                  <path d={pathRevArea} fill="url(#areaRevenueGrad)" />
                  <path d={pathRev} fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
                  <path d={pathOrdArea} fill="url(#areaOrdersGrad)" />
                  <path d={pathOrd} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Slot Labels */}
                  {trendSlots.map((slot: string, i: number) => {
                    const x = padLeft + (i / Math.max(1, numPoints - 1)) * plotW;
                    return (
                      <text key={i} x={x} y={chartH - 8} textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="600">
                        {slot}
                      </text>
                    );
                  })}

                  {/* Peak Tooltip Badges on Chart */}
                  {pointsRev.length > 3 && (
                    <g transform={`translate(${pointsRev[3].x}, ${pointsRev[3].y - 28})`}>
                      <rect x="-24" y="-14" width="48" height="20" rx="6" fill="#F97316" filter="drop-shadow(0 2px 4px rgba(249,115,22,0.3))" />
                      <polygon points="0,8 -5,6 5,6" fill="#F97316" />
                      <text x="0" y="0" textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="bold">
                        ₹5.6K
                      </text>
                    </g>
                  )}

                  {pointsOrd.length > 3 && (
                    <g transform={`translate(${pointsOrd[3].x}, ${pointsOrd[3].y - 26})`}>
                      <rect x="-16" y="-12" width="32" height="18" rx="6" fill="#10B981" filter="drop-shadow(0 2px 4px rgba(16,185,129,0.3))" />
                      <polygon points="0,8 -4,6 4,6" fill="#10B981" />
                      <text x="0" y="1" textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="bold">
                        28
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Peak Summary Bottom Bar */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Revenue</span>
                  <span className="font-bold text-slate-900">₹{Number(kpis.total_revenue).toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Orders</span>
                  <span className="font-bold text-slate-900">{kpis.total_orders}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Peak Revenue</span>
                  <span className="font-bold text-slate-900">{biData?.trends?.peak_revenue_display || "₹5,600 | 4 PM"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Peak Orders</span>
                  <span className="font-bold text-slate-900">{biData?.trends?.peak_orders_display || "28 | 4 PM"}</span>
                </div>
              </div>
            </div>

            {/* Orders by Category Donut Chart */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Orders by Category
                </h2>
                <span className="text-xs text-slate-400 font-semibold">{trendTab.toUpperCase()}</span>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-6 py-1">
                <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F97316" strokeWidth="13" strokeDasharray="131.3 238.76" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#FBBF24" strokeWidth="13" strokeDasharray="47.75 238.76" strokeDashoffset="-131.3" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" strokeWidth="13" strokeDasharray="35.8 238.76" strokeDashoffset="-179.05" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#FB7185" strokeWidth="13" strokeDasharray="23.87 238.76" strokeDashoffset="-214.85" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {kpis.total_orders}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                      TOTAL ORDERS
                    </span>
                  </div>
                </div>

                <div className="space-y-2 w-full max-w-xs text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                      <span className="font-semibold text-slate-700">Main Course</span>
                    </div>
                    <span className="font-bold text-slate-900">55%</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                      <span className="font-semibold text-slate-700">Snacks &amp; Starters</span>
                    </div>
                    <span className="font-bold text-slate-900">20%</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="font-semibold text-slate-700">Beverages &amp; Cocktails</span>
                    </div>
                    <span className="font-bold text-slate-900">15%</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
                      <span className="font-semibold text-slate-700">Desserts</span>
                    </div>
                    <span className="font-bold text-slate-900">10%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100 flex items-center gap-2.5 text-xs text-orange-900">
                <span className="text-base">👑</span>
                <p className="font-medium text-[11px] leading-tight">
                  <strong>Top Category:</strong> Main Course is the most ordered department this period.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards: Top Food, Top Drinks, and Business Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Top Selling Food */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                  <span>Top Selling Food</span>
                </h2>
                <span className="text-xs font-bold text-orange-600">Kitchen</span>
              </div>

              <div className="space-y-3">
                {topFood.map((dish: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {dish.rank || i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/publiq/food/butter-chicken-copper-handi.webp";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {dish.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {dish.orders} Orders &bull; {dish.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      ₹{Number(dish.revenue).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Selling Drinks */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wine className="w-4 h-4 text-indigo-500" />
                  <span>Top Selling Drinks</span>
                </h2>
                <span className="text-xs font-bold text-indigo-600">Bar</span>
              </div>

              <div className="space-y-3">
                {topDrinks.map((drink: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {drink.rank || i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={drink.image}
                          alt={drink.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/menu/cocktails.jpg";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {drink.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {drink.orders} Orders &bull; {drink.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      ₹{Number(drink.revenue).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Insights */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <h2 className="text-base font-bold text-slate-900">
                  Business Insights
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs py-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Revenue Growth</span>
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <span>↑ 8.2%</span>
                    <span className="text-slate-400 font-normal">vs Yesterday</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Top Food Item</span>
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                    {topFood[0]?.name || "Paneer Butter Masala"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Best Seller Drink</span>
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                    {topDrinks[0]?.name || "Classic Mojito"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Peak Business Hour</span>
                  <p className="text-xs font-bold text-orange-600">
                    {biData?.insights?.peak_hour || "1:00 PM - 2:00 PM"}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100 text-center text-xs text-orange-800 font-medium">
                Keep going! You're performing great today. 🎉
              </div>
            </div>
          </div>

          {/* Live Order Workflow (Collapsible) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Live Floor Orders &amp; Super Admin Approval</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Mandatory steward confirmation, department KOT dispatch, and live table progress.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWorkflowSection(!showWorkflowSection)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1"
              >
                <span>{showWorkflowSection ? "Collapse" : "Expand"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWorkflowSection ? "rotate-180" : ""}`} />
              </button>
            </div>

            {showWorkflowSection && (
              <div>
                {!workflowData || !Array.isArray(workflowData.orders) || workflowData.orders.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">All Live Orders Are Up to Date</p>
                    <p className="text-xs text-slate-400">Scan any table QR code or open Waiter Floor App to place orders.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-3">Order #</th>
                          <th className="py-3 px-3">Table</th>
                          <th className="py-3 px-3">Customer</th>
                          <th className="py-3 px-3">Department Items</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(workflowData.orders || []).slice(0, 8).map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.order_number}</td>
                            <td className="py-3 px-3 font-bold text-blue-600">{ord.table_number || "Takeaway"}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{ord.customer_name || "Guest"}</td>
                            <td className="py-3 px-3 max-w-xs truncate">{ord.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(", ") || "—"}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                {ord.order_status}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">₹{ord.final_amount?.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: CUSTOMER HISTORY (MODULE 2)
      ======================================================== */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Customer History Registry</h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive customer profiles, food vs bar breakdown, total billed, total paid, and pending balance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, phone or ID..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    fetchCustomers(e.target.value);
                  }}
                  className="pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 w-64"
                />
              </div>

              <button
                onClick={() => handleExport("customers", "csv")}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 transition"
                title="Export Customers CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Customer ID</th>
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Mobile &bull; Email</th>
                    <th className="py-3.5 px-4 text-center">Orders (Food / Bar)</th>
                    <th className="py-3.5 px-4 text-right">Total Billed</th>
                    <th className="py-3.5 px-4 text-right">Total Paid</th>
                    <th className="py-3.5 px-4 text-right">Pending Balance</th>
                    <th className="py-3.5 px-4">Last Order</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customersData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        No customer records found matching query.
                      </td>
                    </tr>
                  ) : (
                    customersData.map((c) => (
                      <tr key={c.customer_id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{c.unique_customer_id}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          {c.is_vip && (
                            <span className="inline-block px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                              VIP Guest
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-800 font-medium block">{c.phone}</span>
                          <span className="text-[10px] text-slate-400">{c.email}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-extrabold text-slate-900">{c.total_orders}</span>
                          <span className="text-[10px] text-slate-400 block">({c.total_food_orders} Food / {c.total_bar_orders} Bar)</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">₹{Number(c.total_billed).toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">₹{Number(c.total_paid).toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                          {c.pending_payment > 0 ? `₹${Number(c.pending_payment).toLocaleString("en-IN")}` : "₹0.00"}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500 font-medium">{c.most_recent_order_date}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => openCustomerProfile(c.customer_id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: WAITER PERFORMANCE & LEADERBOARD (MODULE 3)
      ======================================================== */}
      {activeTab === "waiters" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Waiter Activity &amp; Service Leaderboard</h2>
              <p className="text-xs text-slate-500 font-medium">
                Tracks orders assigned, accepted, food vs bar items handled, bills processed, and individual bill value handled.
              </p>
            </div>

            <button
              onClick={() => handleExport("waiters", "csv")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Waiters Report</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 text-center">Rank</th>
                    <th className="py-3.5 px-4">Waiter Name</th>
                    <th className="py-3.5 px-4">Employee ID</th>
                    <th className="py-3.5 px-4 text-center">Assigned / Accepted</th>
                    <th className="py-3.5 px-4 text-center">Handled (Food / Bar)</th>
                    <th className="py-3.5 px-4 text-center">Customers Served</th>
                    <th className="py-3.5 px-4 text-right">Bill Value Handled</th>
                    <th className="py-3.5 px-4 text-center">Avg Time</th>
                    <th className="py-3.5 px-4 text-center">Activity Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitersData.map((w) => (
                    <tr key={w.waiter_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-center">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                          w.rank === 1 ? "bg-amber-400 text-amber-950" : w.rank === 2 ? "bg-slate-200 text-slate-800" : "bg-orange-100 text-orange-800"
                        }`}>
                          {w.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{w.name}</span>
                        <span className="text-[10px] text-slate-400">{w.phone}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{w.employee_id}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-slate-900">{w.orders_assigned}</span>
                        <span className="text-[10px] text-slate-400"> ({w.orders_accepted} Accepted)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-emerald-600">{w.orders_handled}</span>
                        <span className="text-[10px] text-slate-400 block">({w.food_orders_handled} Food / {w.bar_orders_handled} Bar)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">{w.customers_served} Guests</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-slate-900 block">₹{Number(w.bill_value_handled).toLocaleString("en-IN")}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">Value Handled</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-600">{w.avg_handling_time_minutes}m</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openWaiterTimeline(w)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs transition cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Timeline</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: KITCHEN & BAR STAFF (MODULE 4 & 5)
      ======================================================== */}
      {activeTab === "kitchen_bar" && (
        <div className="space-y-6">
          {/* Section 1: Food Admin & Kitchen Staff */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Food Admin &amp; Kitchen Performance</h3>
                  <p className="text-xs text-slate-500 font-medium">KOT items prepared, prep times, and culinary sales value.</p>
                </div>
              </div>

              <button
                onClick={() => handleExport("food_admins", "csv")}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Export Food Staff CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {foodAdminsData.map((chef) => (
                <div key={chef.food_admin_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{chef.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{chef.designation} &bull; {chef.employee_id}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">KITCHEN</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Prepared</span>
                      <span className="font-extrabold text-slate-900">{chef.items_prepared}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Quantity</span>
                      <span className="font-extrabold text-slate-900">{chef.food_quantity_sold}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Avg Prep</span>
                      <span className="font-extrabold text-orange-600">{chef.avg_prep_time_minutes}m</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Food Sales Value:</span>
                    <span className="font-mono font-extrabold text-slate-900">₹{Number(chef.food_sales_value).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Bar Admin & Mixology Staff */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Wine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Bar Admin &amp; Mixology Performance</h3>
                  <p className="text-xs text-slate-500 font-medium">Beverage dispense tickets, cocktail quantities, and bar sales value.</p>
                </div>
              </div>

              <button
                onClick={() => handleExport("bar_admins", "csv")}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Export Bar Staff CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barAdminsData.map((bar) => (
                <div key={bar.bar_admin_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{bar.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{bar.designation} &bull; {bar.employee_id}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">BAR</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Prepared</span>
                      <span className="font-extrabold text-slate-900">{bar.drinks_prepared}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Drinks Sold</span>
                      <span className="font-extrabold text-slate-900">{bar.drinks_quantity_sold}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Avg Dispense</span>
                      <span className="font-extrabold text-indigo-600">{bar.avg_prep_time_minutes}m</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Beverage Sales:</span>
                    <span className="font-mono font-extrabold text-slate-900">₹{Number(bar.beverage_sales_value).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: BILLING & FINANCIAL HISTORY (MODULE 7)
      ======================================================== */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Centralized Billing &amp; Financial Registry</h2>
              <p className="text-xs text-slate-500 font-medium">
                Official department GST invoices, subtotal breakdown, CGST 2.5%, SGST 2.5%, and settlement VPAs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice #, guest, or table..."
                  value={billingSearch}
                  onChange={(e) => {
                    setBillingSearch(e.target.value);
                    fetchBilling(e.target.value);
                  }}
                  className="pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 w-64"
                />
              </div>

              <button
                onClick={() => handleExport("billing", "xlsx")}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 transition"
                title="Export Billing Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Order &bull; Table</th>
                    <th className="py-3.5 px-4">Guest &bull; Steward</th>
                    <th className="py-3.5 px-4">Dept</th>
                    <th className="py-3.5 px-4 text-right">Taxable</th>
                    <th className="py-3.5 px-4 text-right">CGST (2.5%)</th>
                    <th className="py-3.5 px-4 text-right">SGST (2.5%)</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-4">Status &bull; Date</th>
                    <th className="py-3.5 px-4 text-center">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billingData.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">#{inv.order_id?.slice(-8) || "ORD"}</span>
                        <span className="text-[10px] text-blue-600 font-bold">Table {inv.table_number}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{inv.customer_name}</span>
                        <span className="text-[10px] text-slate-400">Steward: {inv.waiter_name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          inv.department === "FOOD" ? "bg-orange-100 text-orange-800" : inv.department === "BEVERAGE" ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {inv.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">₹{Number(inv.taxable_amount).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">₹{Number(inv.cgst).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">₹{Number(inv.sgst).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">₹{Number(inv.grand_total).toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600 block">{inv.payment_status}</span>
                        <span className="text-[10px] text-slate-400">{inv.created_at_ist}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-500" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: ACTIVITY AUDIT LOGS (MODULE 8)
      ======================================================== */}
      {activeTab === "audit_logs" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Activity &amp; Security Audit Logs</h2>
              <p className="text-xs text-slate-500 font-medium">
                Centralized immutable log tracking user ID, role, action, order ID, invoice ID, previous value, and updated value.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <select
                value={auditRoleFilter}
                onChange={(e) => {
                  setAuditRoleFilter(e.target.value);
                  fetchAuditLogs(e.target.value, auditSearch);
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="WAITER">Waiter</option>
                <option value="EXECUTIVE_CHEF">Kitchen / Chef</option>
                <option value="BARTENDER">Bartender</option>
                <option value="CUSTOMER">Customer</option>
              </select>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user, action, order #..."
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    fetchAuditLogs(auditRoleFilter, e.target.value);
                  }}
                  className="pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-56"
                />
              </div>

              <button
                onClick={() => handleExport("audit_logs", "csv")}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 transition"
                title="Export Audit Logs CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp (IST)</th>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Order / Invoice</th>
                    <th className="py-3.5 px-4">Previous Value</th>
                    <th className="py-3.5 px-4">Updated Value</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogsData.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{log.timestamp_ist}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{log.user_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700">
                          {log.user_role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{log.action}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{log.order_id || log.invoice_id || "—"}</td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{log.previous_value || "—"}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">{log.updated_value || "—"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {log.action_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REPORT EXPORT SELECTOR (CSV, EXCEL, PDF)
      ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-slate-900 text-base">Export Business Report</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Select Report Type</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="overview">Executive Overview BI Summary</option>
                  <option value="billing">Complete Billing &amp; Financial History</option>
                  <option value="customers">Customer Directory &amp; LTV History</option>
                  <option value="waiters">Waiter Performance &amp; Activity</option>
                  <option value="food_admins">Kitchen Food Admin History</option>
                  <option value="bar_admins">Mixology Bar Admin History</option>
                  <option value="audit_logs">Activity &amp; Security Audit Logs</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Select Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat("xlsx")}
                    className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      exportFormat === "xlsx"
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("pdf")}
                    className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      exportFormat === "pdf"
                        ? "border-rose-500 bg-rose-50/50 text-rose-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-rose-600" />
                    <span>PDF (.pdf)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      exportFormat === "csv"
                        ? "border-orange-500 bg-orange-50/50 text-orange-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <FileCode className="w-5 h-5 text-orange-600" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
                Data will be exported honoring the active date period in <strong>Asia/Kolkata (IST)</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExport(exportType, exportFormat)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Download Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CUSTOMER PROFILE DRILLDOWN
      ======================================================== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span>{selectedCustomer.name}</span>
                  <span className="font-mono text-xs text-slate-400 font-normal">({selectedCustomer.unique_customer_id})</span>
                </h3>
                <p className="text-xs text-slate-500">Phone: {selectedCustomer.phone} &bull; Email: {selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Orders</span>
                <span className="text-base font-black text-slate-900">{selectedCustomer.total_orders}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Billed</span>
                <span className="text-base font-black text-slate-900">₹{selectedCustomer.total_billed}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Paid</span>
                <span className="text-base font-black text-emerald-600">₹{selectedCustomer.total_paid}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Pending Balance</span>
                <span className="text-base font-black text-rose-600">₹{selectedCustomer.pending_payment}</span>
              </div>
            </div>

            {/* Order History List */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Past Dining Orders</h4>
              <div className="space-y-2">
                {(selectedCustomer.orders || []).map((ord: any) => (
                  <div key={ord.order_id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">#{ord.order_number}</span>
                        <span className="text-slate-400">&bull; Table {ord.table_number}</span>
                        <span className="text-slate-400">&bull; {ord.created_at_ist}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">₹{ord.final_amount}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {ord.items?.map((it: any) => `${it.quantity}x ${it.item_name} (₹${it.total_price})`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: WAITER ACTIVITY TIMELINE
      ======================================================== */}
      {selectedWaiter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{selectedWaiter.name}</h3>
                <p className="text-xs text-slate-500 font-medium">Activity Timeline &bull; {selectedWaiter.employee_id}</p>
              </div>
              <button
                onClick={() => setSelectedWaiter(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {waiterTimeline.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No timestamped activity recorded yet for this steward.
                </div>
              ) : (
                <div className="relative pl-5 border-l-2 border-orange-200 space-y-4 text-xs">
                  {waiterTimeline.map((ev, i) => (
                    <div key={i} className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 absolute -left-[27px] top-1" />
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{ev.action}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{ev.timestamp}</span>
                      </div>
                      {ev.table_number && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Table {ev.table_number} &bull; ₹{ev.amount}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INVOICE VIEWER
      ======================================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Tax Invoice #{selectedInvoice.invoice_number}</h3>
                <p className="text-xs text-slate-500">{selectedInvoice.business_name} &bull; {selectedInvoice.created_at_ist}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Table Number:</span>
                <span className="font-bold text-slate-900">Table {selectedInvoice.table_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service Steward:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.waiter_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Taxable Amount:</span>
                <span className="font-mono font-bold text-slate-900">₹{Number(selectedInvoice.taxable_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">CGST (2.5%):</span>
                <span className="font-mono text-slate-700">₹{Number(selectedInvoice.cgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">SGST (2.5%):</span>
                <span className="font-mono text-slate-700">₹{Number(selectedInvoice.sgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-black border-t-2 border-slate-900">
                <span>GRAND TOTAL:</span>
                <span className="font-mono text-slate-900">₹{Number(selectedInvoice.grand_total).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
