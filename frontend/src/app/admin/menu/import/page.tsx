"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  ArrowLeft, RefreshCw, Sparkles, Database, Check, Layers
} from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function MenuImportPage() {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunSync = async () => {
    setIsSyncing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/menu/import-catalogue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Import failed");
      }
      setSyncResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to trigger catalogue import.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#D4AF37]/25">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/menu"
            className="p-2.5 rounded-full bg-[#0A111F] hover:bg-[#0F1626] border border-[#D4AF37]/30 text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0F223D] text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider border border-[#38BDF8]/30">
                Menu Catalogue Integration
              </span>
              <span className="text-xs text-slate-400">Source of Truth: Price_Listing_-_Lanes.xlsx</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Beverages &amp; Food Spreadsheet Importer
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Import, map, and synchronize all 407 drink variants, bar stock, and culinary creations directly into SQLite / PostgreSQL.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunSync}
          disabled={isSyncing}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#070B12] font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Synchronizing..." : "Sync Official Excel Catalogue"}</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      {syncResult && (
        <div className="p-5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 flex items-start gap-4 shadow-xl">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-emerald-300">Catalogue Successfully Synchronized!</h3>
            <p className="text-xs text-emerald-200">{syncResult.message}</p>
            <div className="flex items-center gap-6 pt-2 text-xs font-semibold">
              <span className="bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700/60">
                Total Products: {syncResult.total_items}
              </span>
              <span className="bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700/60">
                Total Size Variants: {syncResult.total_variants}
              </span>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 flex items-center gap-3 shadow-xl">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <span className="text-xs font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Upload & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A111F] rounded-3xl p-6 border border-[#D4AF37]/20 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#070B12] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white">Source Workbook</h3>
            <p className="text-xs text-slate-400 mt-1">
              Active file: <code className="text-[#D4AF37]">Price_Listing_-_Lanes.xlsx</code>
            </p>
          </div>
          <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-[#D4AF37]/15">
            <div className="flex justify-between">
              <span>Total Rows Analyzed:</span>
              <span className="font-bold text-white">408 rows</span>
            </div>
            <div className="flex justify-between">
              <span>Valid Products:</span>
              <span className="font-bold text-[#D4AF37]">407 items</span>
            </div>
            <div className="flex justify-between">
              <span>Active Lanes:</span>
              <span className="font-bold text-emerald-400">Lane 1 MRP (Standard)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A111F] rounded-3xl p-6 border border-[#38BDF8]/20 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#070B12] border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white">Drinks Classification</h3>
            <p className="text-xs text-slate-400 mt-1">
              Proprietor: <span className="text-[#38BDF8] font-bold">Ramesh S P</span> (BEVERAGE)
            </p>
          </div>
          <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-[#38BDF8]/15">
            <div className="flex justify-between">
              <span>Beer &amp; Draught:</span>
              <span className="font-bold text-white">44 products</span>
            </div>
            <div className="flex justify-between">
              <span>Whisky:</span>
              <span className="font-bold text-white">80 products</span>
            </div>
            <div className="flex justify-between">
              <span>Rum, Vodka, Gin, Brandy:</span>
              <span className="font-bold text-white">65 products</span>
            </div>
            <div className="flex justify-between">
              <span>RTD, Wine, Softdrinks &amp; Water:</span>
              <span className="font-bold text-white">31 products</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A111F] rounded-3xl p-6 border border-amber-500/20 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#070B12] border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white">Food Classification</h3>
            <p className="text-xs text-slate-400 mt-1">
              Proprietor: <span className="text-amber-400 font-bold">Anil Biradar</span> (FOOD)
            </p>
          </div>
          <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-amber-500/15">
            <div className="flex justify-between">
              <span>Coastal Cuisine Seafood:</span>
              <span className="font-bold text-white">28 creations</span>
            </div>
            <div className="flex justify-between">
              <span>Tandoor Kebabs &amp; Starters:</span>
              <span className="font-bold text-white">31 creations</span>
            </div>
            <div className="flex justify-between">
              <span>Main Courses &amp; Gravies:</span>
              <span className="font-bold text-white">30 creations</span>
            </div>
            <div className="flex justify-between">
              <span>Oriental, Breads, Soups &amp; More:</span>
              <span className="font-bold text-white">98 creations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Upload Dropzone */}
      <div className="p-8 rounded-3xl bg-[#0A111F] border-2 border-dashed border-[#D4AF37]/30 text-center space-y-4 hover:border-[#D4AF37] transition-colors">
        <div className="w-16 h-16 rounded-full bg-[#070B12] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto shadow-inner">
          <Upload className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-white">Upload Revised Menu (.xlsx / .csv)</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Drag and drop any updated price listing from the restaurant management or click sync above to reprocess the bundled master sheet.
          </p>
        </div>
        <button
          onClick={handleRunSync}
          disabled={isSyncing}
          className="px-6 py-2.5 rounded-full bg-[#0F1626] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#070B12] border border-[#D4AF37]/40 text-xs font-bold transition-all shadow-md"
        >
          {isSyncing ? "Processing Sheet..." : "Sync Master Sheet Directly"}
        </button>
      </div>
    </div>
  );
}
