"use client";

import React from "react";
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
        { name: "Kitchen Display (KDS)", href: "/admin/kot", icon: Flame, badge: "LIVE", badgeColor: "from-amber-500 to-orange-500" },
        { name: "Bar Dispense Station", href: "/admin/bar", icon: Wine, badgeColor: "from-cyan-500 to-blue-600" },
        { name: "Table Floor Plan", href: "/admin/tables", icon: Grid3X3 },
        { name: "Table QR Manager", href: "/admin/qr", icon: QrCode },
      ],
    },
    {
      title: "HOSPITALITY, MEDIA & CMS",
      items: [
        { name: "Website CMS & Media", href: "/admin/cms", icon: ImageIcon, badge: "NEW", badgeColor: "from-blue-600 to-indigo-600" },
        { name: "Cinematic Videos", href: "/admin/videos", icon: Film, badge: "6 HD", badgeColor: "from-purple-600 to-pink-500" },
        { name: "AI Content & Sommelier", href: "/admin/ai-promos", icon: Bot, badge: "AI", badgeColor: "from-emerald-500 to-teal-600" },
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
        { name: "Dual Business Owners", href: "/admin/owners", icon: ShieldCheck, badge: "DUAL", badgeColor: "from-blue-600 to-indigo-600" },
        { name: "Bar Admin (Anil)", href: "/admin/owner/beverage", icon: Wine },
        { name: "Food Admin (Ramesh)", href: "/admin/owner/food", icon: UtensilsCrossed },
        { name: "Staff & Attendance", href: "/admin/employees", icon: Users },
        { name: "Customer Reviews", href: "/admin/reviews", icon: Star, badge: "5★", badgeColor: "from-amber-500 to-orange-500" },
        { name: "Suppliers & Purchases", href: "/admin/suppliers", icon: Truck },
        { name: "Operating Expenses", href: "/admin/expenses", icon: Receipt },
        { name: "Financial & 5% GST Reports", href: "/admin/reports", icon: TrendingUp },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. PREMIUM WHITE ENTERPRISE SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 z-30 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-1.5 flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/logo.png?v=4" alt="PUBLIQ Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-serif text-base font-bold tracking-tight text-slate-900">
                PUBLIQ
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold">
                Enterprise Hospitality
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Single Outlet Info */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600" /> Outlet
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <div className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 tracking-tight">PUBLIQ HARAGADDE</span>
              <span className="text-[10px] text-slate-500 font-medium">Haragadde, Bengaluru</span>
            </div>
            <span className="text-[9px] text-blue-700 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Single Venue
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {navigationSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">
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
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md shadow-xs ${
                            isActive
                              ? "bg-white/20 text-white"
                              : `bg-gradient-to-r ${item.badgeColor || "from-blue-600 to-indigo-600"} text-white`
                          }`}
                        >
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

        {/* Footer: User & Return Link */}
        <div className="p-3 border-t border-slate-100 bg-white space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                VR
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Vikramaditya Roy</p>
                <p className="text-[10px] text-blue-600 font-medium">General Manager</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              ACTIVE
            </span>
          </div>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-600" /> Return to Guest Site
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Operational Header (Pure White & Light Blue) */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              PUBLIQ ENTERPRISE PLATFORM
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium">
              5% GST Non-ITC Composition Mode (SAC 996331)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Cashier Shift Active</p>
              <p className="text-[10px] text-emerald-600 font-semibold">₹5,000 Opening Float</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shadow-xs">
              GM
            </div>
          </div>
        </header>

        {/* Page Content Canvas (Very light slate background) */}
        <main className="p-8 flex-1 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
