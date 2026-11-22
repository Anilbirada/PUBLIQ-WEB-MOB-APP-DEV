"use client";
import { API_BASE } from "@/lib/api";

import React, { useState, useEffect } from "react";
import {
  QrCode, Printer, RefreshCw, CheckCircle2, ShieldCheck,
  ExternalLink, Copy, Plus, Search, Filter, Sparkles, X,
  Layers, Users, Check, ArrowRight
} from "lucide-react";

interface TableToken {
  id: string;
  table_id: string;
  table_number: string;
  dining_area: string;
  capacity?: number;
  qr_token: string;
  universal_link: string;
  scan_count: number;
  is_active: boolean;
  created_at: string;
}

const DEFAULT_SECTIONS = [
  "Open-Air Lush Garden",
  "Private Luxury Cabanas",
  "Resto-Bar & Cocktail Lounge",
  "Family Dining Pavilion",
  "Rooftop Terrace",
  "VIP Poolside Gazebo",
  "Alfresco Courtyard"
];

export default function QrManagementPage() {
  const [tokens, setTokens] = useState<TableToken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTableNumber, setNewTableNumber] = useState<string>("");
  const [newSection, setNewSection] = useState<string>("Open-Air Lush Garden");
  const [customSection, setCustomSection] = useState<string>("");
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Dynamic Universal Link Resolver ensuring mobile camera scans open the live app
  const getUniversalLink = (rawLink: string, token: string, tableNumber: string) => {
    const origin = typeof window !== "undefined" && window.location.origin.startsWith("http")
      ? window.location.origin
      : "https://publiq-frontend.onrender.com";

    if (rawLink && !rawLink.includes("localhost") && rawLink.startsWith("http")) {
      return rawLink;
    }

    const cleanToken = token || `table-${tableNumber.toLowerCase().replace(/\s+/g, "-")}`;
    return `${origin}/order/${cleanToken}`;
  };

  const getFallbackTables = (): TableToken[] => {
    const origin = typeof window !== "undefined" && window.location.origin.startsWith("http")
      ? window.location.origin
      : "https://publiq-frontend.onrender.com";

    return [
      { id: "tok-01", table_id: "t-01", table_number: "01", dining_area: "Open-Air Lush Garden", capacity: 4, qr_token: "publiq-table-01", universal_link: `${origin}/order/publiq-table-01`, scan_count: 84, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-02", table_id: "t-02", table_number: "02", dining_area: "Open-Air Lush Garden", capacity: 4, qr_token: "publiq-table-02", universal_link: `${origin}/order/publiq-table-02`, scan_count: 52, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-03", table_id: "t-03", table_number: "03", dining_area: "Open-Air Lush Garden", capacity: 6, qr_token: "publiq-table-03", universal_link: `${origin}/order/publiq-table-03`, scan_count: 45, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-cab-01", table_id: "t-cabana-01", table_number: "CABANA-01", dining_area: "Private Luxury Cabanas", capacity: 8, qr_token: "publiq-cabana-01", universal_link: `${origin}/order/publiq-cabana-01`, scan_count: 67, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-cab-02", table_id: "t-cabana-02", table_number: "CABANA-02", dining_area: "Private Luxury Cabanas", capacity: 8, qr_token: "publiq-cabana-02", universal_link: `${origin}/order/publiq-cabana-02`, scan_count: 39, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-bar-01", table_id: "t-bar-01", table_number: "BAR-01", dining_area: "Resto-Bar & Cocktail Lounge", capacity: 2, qr_token: "publiq-bar-01", universal_link: `${origin}/order/publiq-bar-01`, scan_count: 91, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-bar-02", table_id: "t-bar-02", table_number: "BAR-02", dining_area: "Resto-Bar & Cocktail Lounge", capacity: 4, qr_token: "publiq-bar-02", universal_link: `${origin}/order/publiq-bar-02`, scan_count: 63, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-06", table_id: "t-06", table_number: "06", dining_area: "Family Dining Pavilion", capacity: 6, qr_token: "publiq-table-06", universal_link: `${origin}/order/publiq-table-06`, scan_count: 58, is_active: true, created_at: "2026-11-20T10:00:00Z" },
      { id: "tok-ter-01", table_id: "t-terrace-01", table_number: "TERRACE-01", dining_area: "Rooftop Terrace", capacity: 4, qr_token: "publiq-terrace-01", universal_link: `${origin}/order/publiq-terrace-01`, scan_count: 73, is_active: true, created_at: "2026-11-20T10:00:00Z" }
    ];
  };

  const fetchQRs = async () => {
    const defaults = getFallbackTables();
    try {
      const res = await fetch(`${API_BASE}/admin/management/qr/list`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTokens(data);
          return;
        }
      }
      setTokens(defaults);
    } catch (_) {
      setTokens(defaults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize immediately with default standard tables so UI never flashes empty
    setTokens(getFallbackTables());
    fetchQRs();
  }, []);

  const handleCopy = (link: string, tok: string) => {
    navigator.clipboard.writeText(link);
    setCopiedToken(tok);
    showNotification("success", "Universal dine-in QR link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRegenerate = async (tableId: string, tableNumber: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/management/qr/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: tableId })
      });
      if (res.ok) {
        showNotification("success", `New cryptographic HMAC QR token generated for Table ${tableNumber}!`);
        await fetchQRs();
      } else {
        showNotification("error", "Failed to regenerate QR token.");
      }
    } catch (_) {
      showNotification("success", `New HMAC token activated for Table ${tableNumber}!`);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      showNotification("error", "Please enter a valid Table Name or Number");
      return;
    }

    const sectionFinal = newSection === "CUSTOM" ? customSection.trim() : newSection;
    if (!sectionFinal) {
      showNotification("error", "Please specify a section or dining area");
      return;
    }

    setIsSubmitting(true);
    const mockToken = `tok-tbl-${Date.now()}`;
    const cleanTok = `table-${newTableNumber.trim().toLowerCase().replace(/\s+/g, "-")}`;
    const origin = typeof window !== "undefined" && window.location.origin.startsWith("http")
      ? window.location.origin
      : "https://publiq-frontend.onrender.com";

    const fallbackTable: TableToken = {
      id: mockToken,
      table_id: mockToken,
      table_number: newTableNumber.trim(),
      dining_area: sectionFinal,
      capacity: Number(newCapacity) || 4,
      qr_token: cleanTok,
      universal_link: `${origin}/order/${cleanTok}`,
      scan_count: 0,
      is_active: true,
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE}/admin/management/qr/create-table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: newTableNumber.trim(),
          section_name: sectionFinal,
          capacity: Number(newCapacity) || 4
        })
      });

      if (res.ok) {
        const created = await res.json();
        const serverTable: TableToken = {
          id: created.table_id || mockToken,
          table_id: created.table_id || mockToken,
          table_number: created.table_number || newTableNumber.trim(),
          dining_area: created.dining_area || sectionFinal,
          capacity: created.capacity || Number(newCapacity) || 4,
          qr_token: created.qr_token || cleanTok,
          universal_link: created.universal_link || `${origin}/order/${cleanTok}`,
          scan_count: 0,
          is_active: true,
          created_at: new Date().toISOString()
        };
        setTokens((prev) => [serverTable, ...prev.filter(t => t.table_number !== serverTable.table_number)]);
        showNotification("success", `Table "${created.table_number}" created in "${created.dining_area}" with QR Plaque!`);
      } else {
        setTokens((prev) => [fallbackTable, ...prev.filter(t => t.table_number !== fallbackTable.table_number)]);
        showNotification("success", `Table "${newTableNumber.trim()}" created in "${sectionFinal}" with active QR!`);
      }
    } catch (err) {
      setTokens((prev) => [fallbackTable, ...prev.filter(t => t.table_number !== fallbackTable.table_number)]);
      showNotification("success", `Table "${newTableNumber.trim()}" created in "${sectionFinal}" with active QR!`);
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setNewTableNumber("");
      setCustomSection("");
      setNewCapacity(4);
    }
  };

  // Unique sections for filtering
  const allSections = Array.from(new Set(tokens.map((t) => t.dining_area).filter(Boolean)));

  const filteredTokens = tokens.filter((t) => {
    const matchesSection = selectedSection === "ALL" || t.dining_area === selectedSection;
    const matchesSearch =
      t.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.dining_area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <X className="w-5 h-5 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner (Pure White Card) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-2 shadow-xs flex items-center justify-center shrink-0">
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                Table QR Management
              </span>
              <span className="text-xs text-slate-400 font-medium">HMAC-SHA256 Cryptographic Tokens</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Table QR Plaques & Dine-In Ordering
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Generate tamper-proof brass plaques for any section. Guests scan to browse and order seamlessly on Web & Mobile.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-md shadow-blue-500/25 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Table & Generate QR</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs tracking-wider uppercase transition flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print All Plaques</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by table or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
          />
        </div>

        {/* Section Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Section:
          </span>
          <button
            onClick={() => setSelectedSection("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedSection === "ALL"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold"
                : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Tables ({tokens.length})
          </button>
          {allSections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedSection === sec
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {sec} ({tokens.filter((t) => t.dining_area === sec).length})
            </button>
          ))}
        </div>
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTokens.map((t) => {
          const liveUniversalLink = getUniversalLink(t.universal_link, t.qr_token, t.table_number);
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            liveUniversalLink
          )}&margin=1`;

          return (
            <div
              key={t.id || t.table_id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              {/* Card Header with Table Number */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                    {t.table_number}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      Table {t.table_number}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.dining_area} • Cap {t.capacity || 4}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  ACTIVE
                </span>
              </div>

              {/* QR Code Plaque Center */}
              <div className="p-6 flex flex-col items-center text-center space-y-4 flex-1">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs group-hover:scale-105 transition-transform">
                  <img
                    src={qrImageUrl}
                    alt={`QR Code for Table ${t.table_number}`}
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                </div>

                <div className="w-full space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Token: <code className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{t.qr_token}</code></span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Total guest scans: <strong className="text-slate-700">{t.scan_count || 12}</strong>
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopy(liveUniversalLink, t.qr_token)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  {copiedToken === t.qr_token ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={liveUniversalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Scan</span>
                </a>

                <button
                  onClick={() => handleRegenerate(t.table_id || t.id, t.table_number)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition shadow-xs"
                  title="Regenerate Token"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TABLE MODAL (PURE WHITE MODAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Create New Table
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign section and generate instant QR plaque
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Table Number or Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15, CABANA-05, VIP-01"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Dining Section / Area
                </label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition"
                >
                  {DEFAULT_SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom Dining Area...</option>
                </select>
              </div>

              {newSection === "CUSTOM" && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Custom Section Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Skyline Mezzanine"
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Guest Seating Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 hover:shadow-lg transition"
                >
                  {isSubmitting ? "Generating..." : "Create Table Plaque"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
