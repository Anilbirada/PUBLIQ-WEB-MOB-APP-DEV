"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Flame, Wine, Grid3X3, QrCode,
  Package, Beer, BookOpen, UtensilsCrossed, Users, Truck,
  Receipt, TrendingUp, Store, ChevronRight, LogOut, ArrowLeft,
  Bell, CheckCircle2, Film, Bot, Calendar, PartyPopper, Image as ImageIcon,
  ShieldCheck, Star
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navigationSections = [
    {
      title: "OPERATIONS",
      items: [
        { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Restaurant & Bar POS", href: "/admin/pos", icon: ShoppingCart },
        { name: "Kitchen Display (KDS)", href: "/admin/kot", icon: Flame, badge: "LIVE" },
        { name: "Bar Dispense Station", href: "/admin/bar", icon: Wine },
        { name: "Table Floor Plan", href: "/admin/tables", icon: Grid3X3 },
        { name: "Table QR Manager", href: "/admin/qr", icon: QrCode },
      ],
    },
    {
      title: "HOSPITALITY, MEDIA & CMS",
      items: [
        { name: "Website CMS & Media", href: "/admin/cms", icon: ImageIcon, badge: "NEW" },
        { name: "Cinematic Videos", href: "/admin/videos", icon: Film, badge: "6 HD" },
        { name: "AI Content & Sommelier", href: "/admin/ai-promos", icon: Bot, badge: "LIVE" },
        { name: "Party & Event Enquiries", href: "/admin/events", icon: PartyPopper },
        { name: "Guest Reservations", href: "/admin/reservations", icon: Calendar },
        { name: "Centralized Menu", href: "/admin/menu", icon: UtensilsCrossed },
      ],
    },
    {
      title: "INVENTORY & PRECISION BAR",
      items: [
        { name: "Liquor Cellar & mL Pour", href: "/admin/inventory/liquor", icon: Beer },
        { name: "Kitchen Raw Materials", href: "/admin/inventory/restaurant", icon: Package },
        { name: "Recipe Costing & Margins", href: "/admin/recipes", icon: BookOpen },
      ],
    },
    {
      title: "MANAGEMENT & GOVERNANCE",
      items: [
        { name: "Dual Business Owners", href: "/admin/owners", icon: ShieldCheck, badge: "DUAL" },
        { name: "Bar Admin (Anil)", href: "/admin/owner/beverage", icon: Wine },
        { name: "Food Admin (Ramesh)", href: "/admin/owner/food", icon: UtensilsCrossed },
        { name: "Staff & Attendance", href: "/admin/employees", icon: Users },
        { name: "Customer Reviews", href: "/admin/reviews", icon: Star, badge: "NEW" },
        { name: "Suppliers & Purchases", href: "/admin/suppliers", icon: Truck },
        { name: "Operating Expenses", href: "/admin/expenses", icon: Receipt },
        { name: "Financial & 5% GST Reports", href: "/admin/reports", icon: TrendingUp },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex font-sans selection:bg-[#D4AF37] selection:text-[#070B12]">
      {/* 1. ENTERPRISE LUXURY SIDEBAR */}
      <aside className="w-72 bg-[#060B14] border-r border-[#38BDF8]/20 flex flex-col flex-shrink-0 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#38BDF8]/20 flex items-center justify-between bg-gradient-to-r from-[#060B14] to-[#0B1528]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#091528] border border-[#38BDF8]/50 p-1 flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/images/publiq/branding/publiq-crest-gold.png?v=4" alt="PUBLIQ Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-serif text-base font-bold tracking-widest text-white">
                PUBLIQ
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-[#38BDF8] font-bold">
                Enterprise Hospitality
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Single Outlet */}
        <div className="p-4 border-b border-[#38BDF8]/15 bg-[#08101E]/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Store className="w-3 h-3 text-[#38BDF8]" /> Outlet
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <div className="w-full bg-[#0A1526] border border-[#38BDF8]/30 text-white rounded-lg px-3 py-2 flex items-center justify-between shadow-inner">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-wide">PUBLIQ HARAGADDE</span>
              <span className="text-[9px] text-slate-400 font-medium">Haragadde, Bengaluru</span>
            </div>
            <span className="text-[9px] text-[#38BDF8] font-bold uppercase tracking-wider bg-[#38BDF8]/10 px-1.5 py-0.5 rounded border border-[#38BDF8]/30">Single Venue</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {navigationSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-3 text-[10px] uppercase font-bold tracking-widest text-sky-400/80">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#0369A1]/30 to-[#0A1526] text-[#38BDF8] font-bold shadow-md border-l-4 border-[#38BDF8]"
                          : "text-slate-400 hover:bg-[#0A1526]/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-[#38BDF8]" : "text-slate-500"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: User & Back to Customer Site */}
        <div className="p-3 border-t border-[#D4AF37]/20 bg-[#070B12]/60 space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#996515] text-[#070B12] font-bold flex items-center justify-center text-xs">
                VR
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Vikramaditya Roy</p>
                <p className="text-[10px] text-[#D4AF37]">General Manager</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/40">
              OPEN
            </span>
          </div>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#0F1626] rounded-xl transition-all border border-[#D4AF37]/20"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" /> Return to Guest Site
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Operational Header (Refined Navy & Light Blue) */}
        <header className="h-16 bg-gradient-to-r from-[#060B14] via-[#091528] to-[#060B14] border-b border-[#38BDF8]/20 px-8 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#38BDF8] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
              PUBLIQ ENTERPRISE PLATFORM
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-300 font-medium">
              5% GST Non-ITC Composition Mode (SAC 996331)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-white">Cashier Shift Active</p>
              <p className="text-[10px] text-emerald-400 font-semibold">₹5,000 Opening Float</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0A1526] border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center text-xs font-bold">
              GM
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1 bg-[#040810]">
          {children}
        </main>
      </div>
    </div>
  );
}
