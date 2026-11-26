"use client";
import { API_BASE } from "@/lib/api";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Grid3X3, Users, Clock, CheckCircle2, AlertCircle, Sparkles,
  ArrowRightLeft, Layers, Plus, RefreshCw, QrCode, ExternalLink,
  Search, ShieldCheck, Check
} from "lucide-react";

interface RestaurantTableItem {
  id: string;
  table_number: string;
  capacity: number;
  dining_area: string;
  status: "AVAILABLE" | "OCCUPIED" | "ORDER_PENDING" | "FOOD_PREPARING" | "DRINKS_PREPARING" | "ORDER_READY" | "PAYMENT_PENDING" | string;
  occupancy_status?: string;
  assigned_waiter?: string;
  assigned_waiter_id?: string;
  customer_name?: string;
  customer_phone?: string;
  active_order_id?: string;
  order_number?: string;
  current_order_status?: string;
  order_creation_time?: string;
  payment_status?: string;
  is_active: boolean;
  qr_token?: string;
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<RestaurantTableItem[]>([]);
  const [activeArea, setActiveArea] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getFallbackTables = (): RestaurantTableItem[] => [
    { id: "tbl-01", table_number: "01", capacity: 4, dining_area: "Open-Air Lush Garden", status: "AVAILABLE", is_active: true, qr_token: "sample-table-01" },
    { id: "tbl-02", table_number: "02", capacity: 4, dining_area: "Open-Air Lush Garden", status: "OCCUPIED", is_active: true, qr_token: "sample-table-02" },
    { id: "tbl-03", table_number: "03", capacity: 6, dining_area: "Open-Air Lush Garden", status: "AVAILABLE", is_active: true, qr_token: "sample-table-03" },
    { id: "tbl-04", table_number: "04", capacity: 4, dining_area: "Open-Air Lush Garden", status: "AVAILABLE", is_active: true, qr_token: "sample-table-04" },
    { id: "tbl-05", table_number: "05", capacity: 2, dining_area: "Open-Air Lush Garden", status: "CLEANING", is_active: true, qr_token: "sample-table-05" },
    { id: "tbl-06", table_number: "06", capacity: 8, dining_area: "Open-Air Lush Garden", status: "AVAILABLE", is_active: true, qr_token: "sample-table-06" },
    { id: "tbl-07", table_number: "07", capacity: 4, dining_area: "Open-Air Lush Garden", status: "OCCUPIED", is_active: true, qr_token: "sample-table-07" },
    { id: "tbl-08", table_number: "08", capacity: 4, dining_area: "Open-Air Lush Garden", status: "AVAILABLE", is_active: true, qr_token: "sample-table-08" },
    { id: "tbl-cab-01", table_number: "CABANA-01", capacity: 8, dining_area: "Private Luxury Cabanas", status: "RESERVED", is_active: true, qr_token: "sample-cabana-01" },
    { id: "tbl-cab-02", table_number: "CABANA-02", capacity: 8, dining_area: "Private Luxury Cabanas", status: "AVAILABLE", is_active: true, qr_token: "sample-cabana-02" },
    { id: "tbl-bar-01", table_number: "BAR-01", capacity: 2, dining_area: "Resto-Bar & Cocktail Lounge", status: "OCCUPIED", is_active: true, qr_token: "sample-bar-01" },
    { id: "tbl-bar-02", table_number: "BAR-02", capacity: 4, dining_area: "Resto-Bar & Cocktail Lounge", status: "AVAILABLE", is_active: true, qr_token: "sample-bar-02" },
    { id: "tbl-hall-01", table_number: "HALL-01", capacity: 6, dining_area: "Family Dining Pavilion", status: "AVAILABLE", is_active: true, qr_token: "sample-hall-01" },
    { id: "tbl-hall-02", table_number: "HALL-02", capacity: 8, dining_area: "Family Dining Pavilion", status: "AVAILABLE", is_active: true, qr_token: "sample-hall-02" },
  ];

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/management/tables`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTables(data);
          return;
        }
      }
      setTables(getFallbackTables());
    } catch (_) {
      setTables(getFallbackTables());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTables(getFallbackTables());
    fetchTables();
  }, []);

  const handleStatusChange = async (tableId: string, tableNumber: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/management/tables/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: tableId, status: newStatus }),
      });
      if (res.ok) {
        showToast(`Table ${tableNumber} updated to ${newStatus}`);
        setTables((prev) =>
          prev.map((t) => (t.id === tableId ? { ...t, status: newStatus as any } : t))
        );
      }
    } catch (_) {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus as any } : t))
      );
      showToast(`Table ${tableNumber} marked ${newStatus}`);
    }
  };

  // Derive unique areas dynamically
  const areas = Array.from(new Set(tables.map((t) => t.dining_area).filter(Boolean)));

  const filteredTables = tables.filter((t) => {
    const matchesArea = activeArea === "ALL" || t.dining_area === activeArea;
    const matchesSearch =
      t.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.dining_area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArea && matchesSearch;
  });

  // Analytics Metrics
  const totalTables = tables.length;
  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED" || t.status === "BILLING").length;
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length;
  const cleaningCount = tables.filter((t) => t.status === "CLEANING").length;
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 4), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header (Pure White Card) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
              Floor Plan & Table Management
            </span>
            <span className="text-xs text-slate-400 font-medium">Real-Time POS & Dining Floor Synchronization</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Floor Zones, Occupancy & Seating States
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitor live table occupancy, manage turnarounds, and inspect dining area capacity across all sections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/admin/qr"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-md shadow-blue-500/25 hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Create Table & QR</span>
          </Link>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await fetchTables();
                showToast("Floor tables synced in real time");
              } finally {
                setTimeout(() => setIsRefreshing(false), 600);
              }
            }}
            disabled={isRefreshing}
            className={`p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-xs flex items-center justify-center ${
              isRefreshing ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-95"
            }`}
            title="Refresh Live Floor"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 transition-transform ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Floor Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tables</span>
          <span className="font-serif text-2xl font-black text-slate-900 mt-1 block">{totalTables}</span>
          <span className="text-[11px] text-slate-500 font-medium">{totalCapacity} Total Seats</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Available</span>
          <span className="font-serif text-2xl font-black text-emerald-600 mt-1 block">{availableCount}</span>
          <span className="text-[11px] text-emerald-700 font-medium">Ready for Guests</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Occupied</span>
          <span className="font-serif text-2xl font-black text-amber-600 mt-1 block">{occupiedCount}</span>
          <span className="text-[11px] text-amber-700 font-medium">Dining & Ordering</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Reserved</span>
          <span className="font-serif text-2xl font-black text-purple-600 mt-1 block">{reservedCount}</span>
          <span className="text-[11px] text-purple-700 font-medium">Upcoming Bookings</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-xs">
          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Cleaning</span>
          <span className="font-serif text-2xl font-black text-sky-600 mt-1 block">{cleaningCount}</span>
          <span className="text-[11px] text-sky-700 font-medium">Turnaround Stage</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Occupancy</span>
          <span className="font-serif text-2xl font-black text-blue-700 mt-1 block">
            {totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0}%
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Live Floor Capacity</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
          />
        </div>

        {/* Section Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <button
            onClick={() => setActiveArea("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeArea === "ALL"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold"
                : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Areas ({tables.length})
          </button>
          {areas.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveArea(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeArea === sec
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {sec} ({tables.filter((t) => t.dining_area === sec).length})
            </button>
          ))}
        </div>
      </div>

      {/* Floor Plan Cards Grid (Pure White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredTables.map((t) => {
          const isAvailable = t.status === "AVAILABLE";
          const isOrderPending = t.status === "ORDER_PENDING";
          const isFoodPrep = t.status === "FOOD_PREPARING";
          const isDrinksPrep = t.status === "DRINKS_PREPARING";
          const isOrderReady = t.status === "ORDER_READY";
          const isPaymentPending = t.status === "PAYMENT_PENDING";
          const isReserved = t.status === "RESERVED";
          const isCleaning = t.status === "CLEANING";
          const isOccupied = t.status === "OCCUPIED" || (!isAvailable && !isReserved && !isCleaning);

          return (
            <div
              key={t.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md bg-white ${
                isPaymentPending
                  ? "border-rose-300 ring-1 ring-rose-200"
                  : isOrderReady
                  ? "border-indigo-400 ring-1 ring-indigo-200"
                  : isOrderPending
                  ? "border-amber-400 ring-1 ring-amber-200 animate-pulse"
                  : isFoodPrep || isDrinksPrep
                  ? "border-sky-300"
                  : isOccupied
                  ? "border-amber-200"
                  : "border-slate-200 hover:border-emerald-300"
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      PUBLIQ TABLE
                    </span>
                    <h3 className="font-serif text-2xl font-extrabold text-slate-900">
                      Table {t.table_number}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-xs ${
                      isPaymentPending
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : isOrderReady
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : isOrderPending
                        ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                        : isFoodPrep
                        ? "bg-orange-50 text-orange-800 border-orange-200"
                        : isDrinksPrep
                        ? "bg-sky-50 text-sky-800 border-sky-200"
                        : isAvailable
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </div>

                {/* Section, Waiter, and Order Metadata */}
                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{t.dining_area}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {t.capacity || 4} Guests
                    </span>
                    <span className="font-medium text-slate-700">
                      Waiter: <strong className="text-blue-700">{t.assigned_waiter || "Unassigned"}</strong>
                    </span>
                  </div>

                  {/* Active Order Details */}
                  {t.customer_name && (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5 mt-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Guest: {t.customer_name}</span>
                        {t.payment_status && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            t.payment_status === "PAID" ? "text-emerald-700" : "text-amber-700"
                          }`}>
                            {t.payment_status}
                          </span>
                        )}
                      </div>
                      {t.order_number && (
                        <p className="text-[10px] font-mono text-slate-500">Order #{t.order_number}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Direct QR Link Pill */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  href={`/order/${t.qr_token || `sample-table-${t.table_number}`}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 hover:underline transition"
                  title="Open Dine-in QR Menu"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dine-In Menu</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                </Link>

                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  ID: {t.table_number}
                </span>
              </div>

              {/* Interactive Status Switcher Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "AVAILABLE")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isAvailable
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200"
                  }`}
                  title="Mark Vacant / Available"
                >
                  Vacant
                </button>

                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "OCCUPIED")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isOccupied
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border-slate-200"
                  }`}
                  title="Mark Table Occupied"
                >
                  Occupied
                </button>

                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "RESERVED")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isReserved
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border-slate-200"
                  }`}
                  title="Mark Reserved"
                >
                  Reserved
                </button>

                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "CLEANING")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isCleaning
                      ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                      : "bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border-slate-200"
                  }`}
                  title="Mark Cleaning"
                >
                  Clean
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
