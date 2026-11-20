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
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING" | "BILLING";
  is_active: boolean;
  qr_token?: string;
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<RestaurantTableItem[]>([]);
  const [activeArea, setActiveArea] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/management/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      } else {
        throw new Error("Failed to load");
      }
    } catch (_) {
      // Luxury Fallback Tables
      const fallbackList: RestaurantTableItem[] = [
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
      setTables(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#0F223D] text-white shadow-2xl border border-[#38BDF8] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Luxury Page Header */}
      <div className="bg-[#0B1528]/80 rounded-3xl p-6 sm:p-8 border border-[#38BDF8]/25 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0F223D] text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider border border-[#38BDF8]/30">
              Floor Plan & Table Management
            </span>
            <span className="text-xs text-slate-400">Real-Time POS & Dining Floor Synchronization</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Floor Zones, Occupancy & Seating States
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Monitor live table occupancy, manage turnarounds, and inspect dining area capacity across all sections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/qr"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-bold text-xs tracking-wider uppercase transition shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#070B12]" />
            <span>+ Create Table & QR</span>
          </Link>
          <button
            onClick={fetchTables}
            className="p-3 rounded-2xl bg-[#070E1A] hover:bg-[#0D1F38] border border-[#38BDF8]/30 text-white transition shadow-sm"
            title="Refresh Live Floor"
          >
            <RefreshCw className="w-4 h-4 text-[#38BDF8]" />
          </button>
        </div>
      </div>

      {/* Floor Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0B1528]/80 p-4 rounded-2xl border border-[#38BDF8]/20 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tables</span>
          <span className="font-serif text-2xl font-bold text-white mt-1 block">{totalTables}</span>
          <span className="text-[11px] text-slate-400">{totalCapacity} Total Seats</span>
        </div>
        <div className="bg-[#0B1528]/80 p-4 rounded-2xl border border-emerald-500/30 shadow-xl">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Available</span>
          <span className="font-serif text-2xl font-bold text-emerald-400 mt-1 block">{availableCount}</span>
          <span className="text-[11px] text-emerald-400/80 font-medium">Ready for Guests</span>
        </div>
        <div className="bg-[#0B1528]/80 p-4 rounded-2xl border border-amber-500/30 shadow-xl">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Occupied</span>
          <span className="font-serif text-2xl font-bold text-amber-300 mt-1 block">{occupiedCount}</span>
          <span className="text-[11px] text-amber-300/80 font-medium">Dining & Ordering</span>
        </div>
        <div className="bg-[#0B1528]/80 p-4 rounded-2xl border border-purple-500/30 shadow-xl">
          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Reserved</span>
          <span className="font-serif text-2xl font-bold text-purple-300 mt-1 block">{reservedCount}</span>
          <span className="text-[11px] text-purple-300/80 font-medium">Upcoming Bookings</span>
        </div>
        <div className="bg-[#0B1528]/80 p-4 rounded-2xl border border-yellow-500/30 shadow-xl">
          <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider block">Cleaning</span>
          <span className="font-serif text-2xl font-bold text-yellow-300 mt-1 block">{cleaningCount}</span>
          <span className="text-[11px] text-yellow-300/80 font-medium">Turnaround Stage</span>
        </div>
        <div className="bg-[#0B1528]/80 p-4 rounded-2xl border border-[#38BDF8]/25 shadow-xl">
          <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider block">Occupancy Rate</span>
          <span className="font-serif text-2xl font-bold text-white mt-1 block">
            {totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0}%
          </span>
          <span className="text-[11px] text-slate-400">Live Floor Capacity</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0B1528]/80 rounded-2xl p-4 border border-[#38BDF8]/20 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#070E1A] rounded-xl border border-[#38BDF8]/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        {/* Dynamic Section Filter Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <button
            onClick={() => setActiveArea("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeArea === "ALL"
                ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] shadow-md font-bold"
                : "bg-[#070E1A] border border-[#38BDF8]/25 text-slate-300 hover:text-white hover:border-[#38BDF8]/50"
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
                  ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] shadow-md font-bold"
                  : "bg-[#070E1A] border border-[#38BDF8]/25 text-slate-300 hover:text-white hover:border-[#38BDF8]/50"
              }`}
            >
              {sec} ({tables.filter((t) => t.dining_area === sec).length})
            </button>
          ))}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Loading restaurant floor plan...</p>
        </div>
      )}

      {/* Floor Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredTables.map((t) => {
          const isAvailable = t.status === "AVAILABLE";
          const isOccupied = t.status === "OCCUPIED" || t.status === "BILLING";
          const isReserved = t.status === "RESERVED";
          const isCleaning = t.status === "CLEANING";

          return (
            <div
              key={t.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl ${
                isOccupied
                  ? "bg-[#1A1408]/90 border-amber-500/50"
                  : isReserved
                  ? "bg-[#160B24]/90 border-purple-500/50"
                  : isCleaning
                  ? "bg-[#1A1808]/90 border-yellow-500/50"
                  : "bg-[#0B1528]/80 border-[#38BDF8]/25 hover:border-[#38BDF8]/60"
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] block">
                      PUBLIQ TABLE
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-white">
                      Table {t.table_number}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                      isOccupied
                        ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                        : isReserved
                        ? "bg-purple-950/80 text-purple-300 border-purple-500/40"
                        : isCleaning
                        ? "bg-yellow-950/80 text-yellow-300 border-yellow-500/40"
                        : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Section & Capacity */}
                <div className="space-y-1 mt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                    <span>{t.dining_area}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Capacity: {t.capacity || 4} Guests</span>
                  </div>
                </div>
              </div>

              {/* Direct QR Link Pill */}
              <div className="pt-2 border-t border-[#38BDF8]/20 flex items-center justify-between text-xs">
                <Link
                  href={`/order/${t.qr_token || `sample-table-${t.table_number}`}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#38BDF8] hover:text-[#D4AF37] transition"
                  title="Open Dine-in QR Menu"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Dine-In Menu</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                </Link>

                <span className="text-[10px] font-mono text-slate-300 bg-[#070E1A] px-2 py-0.5 rounded border border-[#38BDF8]/20">
                  ID: {t.table_number}
                </span>
              </div>

              {/* Interactive Status Switcher Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "AVAILABLE")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isAvailable
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                      : "bg-[#070E1A] hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-400 border-[#38BDF8]/20"
                  }`}
                  title="Mark Vacant / Available"
                >
                  Vacant
                </button>

                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "OCCUPIED")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isOccupied
                      ? "bg-amber-600 text-white border-amber-500 shadow-md"
                      : "bg-[#070E1A] hover:bg-amber-950/40 text-slate-300 hover:text-amber-400 border-[#38BDF8]/20"
                  }`}
                  title="Mark Table Occupied"
                >
                  Occupied
                </button>

                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "RESERVED")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isReserved
                      ? "bg-purple-600 text-white border-purple-500 shadow-md"
                      : "bg-[#070E1A] hover:bg-purple-950/40 text-slate-300 hover:text-purple-400 border-[#38BDF8]/20"
                  }`}
                  title="Mark Reserved"
                >
                  Reserved
                </button>

                <button
                  onClick={() => handleStatusChange(t.id, t.table_number, "CLEANING")}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition ${
                    isCleaning
                      ? "bg-yellow-600 text-white border-yellow-500 shadow-md"
                      : "bg-[#070E1A] hover:bg-yellow-950/40 text-slate-300 hover:text-yellow-400 border-[#38BDF8]/20"
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
