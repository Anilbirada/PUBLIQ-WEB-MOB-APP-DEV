"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Flame, Wine, Grid3X3, QrCode,
  Package, Beer, BookOpen, UtensilsCrossed, Users, Truck,
  Receipt, TrendingUp, Store, ChevronRight, LogOut, ArrowLeft,
  Bell, CheckCircle2, Film, Bot, Calendar, PartyPopper, Image as ImageIcon,
  ShieldCheck, Star, Key, RefreshCw, Clock
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LiveClock } from "@/components/LiveClock";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("publiq_auth_user");
      if (!storedUser) {
        router.replace("/login");
        return;
      }
      try {
        const parsed = JSON.parse(storedUser);
        const allowedAdminRoles = [
          "SUPER_ADMIN", "BAR_ADMIN", "FOOD_ADMIN", "EXECUTIVE_CHEF", 
          "CASHIER", "STOREKEEPER", "ACCOUNTANT"
        ];
        if (!allowedAdminRoles.includes(parsed.role)) {
          if (parsed.role === "WAITER") {
            router.replace("/waiter");
          } else {
            router.replace("/login");
          }
          return;
        }

        // Department route authorization for operational managers & staff:
        if (parsed.role === "BAR_ADMIN") {
          const barAllowed = ["/admin/owner/beverage", "/admin/bar", "/admin/inventory/liquor", "/admin/menu", "/admin/owners", "/admin/reviews"];
          const isAllowed = barAllowed.some((r) => pathname === r || pathname?.startsWith(r + "/"));
          if (!isAllowed) {
            router.replace("/admin/owner/beverage");
            return;
          }
        } else if (parsed.role === "FOOD_ADMIN") {
          const foodAllowed = ["/admin/owner/food", "/admin/kot", "/admin/inventory/restaurant", "/admin/recipes", "/admin/menu", "/admin/owners", "/admin/reviews"];
          const isAllowed = foodAllowed.some((r) => pathname === r || pathname?.startsWith(r + "/"));
          if (!isAllowed) {
            router.replace("/admin/owner/food");
            return;
          }
        } else if (parsed.role === "EXECUTIVE_CHEF") {
          const chefAllowed = ["/admin/owner/food", "/admin/kot", "/admin/inventory/restaurant", "/admin/recipes", "/admin/menu"];
          const isAllowed = chefAllowed.some((r) => pathname === r || pathname?.startsWith(r + "/"));
          if (!isAllowed) {
            router.replace("/admin/owner/food");
            return;
          }
        } else if (parsed.role === "CASHIER") {
          const cashierAllowed = ["/admin/pos", "/admin/invoices", "/admin/tables"];
          const isAllowed = cashierAllowed.some((r) => pathname === r || pathname?.startsWith(r + "/"));
          if (!isAllowed) {
            router.replace("/admin/pos");
            return;
          }
        } else if (parsed.role === "STOREKEEPER") {
          const storeAllowed = ["/admin/inventory/liquor", "/admin/inventory/restaurant", "/admin/suppliers"];
          const isAllowed = storeAllowed.some((r) => pathname === r || pathname?.startsWith(r + "/"));
          if (!isAllowed) {
            router.replace("/admin/inventory/liquor");
            return;
          }
        } else if (parsed.role === "ACCOUNTANT") {
          const acctAllowed = ["/admin/reports", "/admin/invoices", "/admin/expenses"];
          const isAllowed = acctAllowed.some((r) => pathname === r || pathname?.startsWith(r + "/"));
          if (!isAllowed) {
            router.replace("/admin/reports");
            return;
          }
        }
      } catch (_) {
        router.replace("/login");
      }
    }
  }, [router, pathname]);

  const currentRole = (mounted && user?.role) ? user.role : "SUPER_ADMIN";

  const allSections = [
    {
      title: "OPERATIONS",
      items: [
        { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["SUPER_ADMIN"] },
        { name: "Live Order Workflow", href: "/admin/orders", icon: Clock, badge: "REALTIME", badgeColor: "from-blue-600 to-indigo-600", roles: ["SUPER_ADMIN", "FOOD_ADMIN", "BAR_ADMIN", "CASHIER"] },
        { name: "Waiter Floor Terminal", href: "/waiter", icon: UtensilsCrossed, badge: "FLOOR", badgeColor: "from-emerald-500 to-teal-600", roles: ["SUPER_ADMIN", "WAITER"] },
        { name: "Restaurant & Bar POS", href: "/admin/pos", icon: ShoppingCart, roles: ["SUPER_ADMIN", "CASHIER"] },
        { name: "Kitchen Display (KDS)", href: "/admin/kot", icon: Flame, badge: "LIVE", badgeColor: "from-amber-500 to-orange-500", roles: ["SUPER_ADMIN", "FOOD_ADMIN", "EXECUTIVE_CHEF"] },
        { name: "Bar Dispense Station", href: "/admin/bar", icon: Wine, badgeColor: "from-cyan-500 to-blue-600", roles: ["SUPER_ADMIN", "BAR_ADMIN"] },
        { name: "Table Floor Plan", href: "/admin/tables", icon: Grid3X3, roles: ["SUPER_ADMIN", "CASHIER"] },
        { name: "Table QR Manager", href: "/admin/qr", icon: QrCode, roles: ["SUPER_ADMIN"] },
      ],
    },
    {
      title: "HOSPITALITY, MEDIA & CMS",
      items: [
        { name: "Website CMS & Media", href: "/admin/cms", icon: ImageIcon, badge: "NEW", badgeColor: "from-blue-600 to-indigo-600", roles: ["SUPER_ADMIN"] },
        { name: "Cinematic Videos", href: "/admin/videos", icon: Film, badge: "6 HD", badgeColor: "from-purple-600 to-pink-500", roles: ["SUPER_ADMIN"] },
        { name: "AI Content & Sommelier", href: "/admin/ai-promos", icon: Bot, badge: "AI", badgeColor: "from-emerald-500 to-teal-600", roles: ["SUPER_ADMIN"] },
        { name: "Party & Event Enquiries", href: "/admin/events", icon: PartyPopper, roles: ["SUPER_ADMIN"] },
        { name: "Guest Reservations", href: "/admin/reservations", icon: Calendar, roles: ["SUPER_ADMIN"] },
        { name: "Centralized Menu", href: "/admin/menu", icon: UtensilsCrossed, roles: ["SUPER_ADMIN", "BAR_ADMIN", "FOOD_ADMIN", "EXECUTIVE_CHEF"] },
      ],
    },
    {
      title: "INVENTORY & PRECISION BAR",
      items: [
        { name: "Liquor Cellar & mL Pour", href: "/admin/inventory/liquor", icon: Beer, roles: ["SUPER_ADMIN", "BAR_ADMIN", "STOREKEEPER"] },
        { name: "Kitchen Raw Materials", href: "/admin/inventory/restaurant", icon: Package, roles: ["SUPER_ADMIN", "FOOD_ADMIN", "STOREKEEPER", "EXECUTIVE_CHEF"] },
        { name: "Recipe Costing & Margins", href: "/admin/recipes", icon: BookOpen, roles: ["SUPER_ADMIN", "FOOD_ADMIN", "EXECUTIVE_CHEF"] },
      ],
    },
    {
      title: "MANAGEMENT & GOVERNANCE",
      items: [
        { name: "Dual Business Owners", href: "/admin/owners", icon: ShieldCheck, badge: "DUAL", badgeColor: "from-blue-600 to-indigo-600", roles: ["SUPER_ADMIN"] },
        { name: "Bar Admin (Anil)", href: "/admin/owner/beverage", icon: Wine, badge: "8431712924-3@ybl", badgeColor: "from-cyan-500 to-blue-600", roles: ["SUPER_ADMIN", "BAR_ADMIN"] },
        { name: "Food Admin (Ramesh)", href: "/admin/owner/food", icon: UtensilsCrossed, badge: "ramesh776059@ybl", badgeColor: "from-amber-500 to-orange-500", roles: ["SUPER_ADMIN", "FOOD_ADMIN", "EXECUTIVE_CHEF"] },
        { name: "Staff & Attendance", href: "/admin/employees", icon: Users, roles: ["SUPER_ADMIN"] },
        { name: "Billing & Invoices", href: "/admin/invoices", icon: Receipt, badge: "GST", badgeColor: "from-emerald-500 to-teal-600", roles: ["SUPER_ADMIN", "CASHIER", "ACCOUNTANT"] },
        { name: "Customer Reviews", href: "/admin/reviews", icon: Star, badge: "5★", badgeColor: "from-amber-500 to-orange-500", roles: ["SUPER_ADMIN", "BAR_ADMIN", "FOOD_ADMIN"] },
        { name: "Suppliers & Purchases", href: "/admin/suppliers", icon: Truck, roles: ["SUPER_ADMIN", "STOREKEEPER"] },
        { name: "Operating Expenses", href: "/admin/expenses", icon: Receipt, roles: ["SUPER_ADMIN", "ACCOUNTANT"] },
        { name: "Financial & 5% GST Reports", href: "/admin/reports", icon: TrendingUp, roles: ["SUPER_ADMIN", "ACCOUNTANT"] },
      ],
    },
  ];

  // Filter sections and items based on active role
  const navigationSections = allSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) =>
        currentRole === "SUPER_ADMIN" ? true : item.roles.includes(currentRole)
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  // Profile details based on active role
  const getProfileMeta = () => {
    switch (currentRole) {
      case "BAR_ADMIN":
        return {
          name: user?.fullName || "Anil",
          roleTitle: "Bar Admin (Beverage Division)",
          badge: "BAR ADMIN",
          badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
          initials: "AN",
          avatarGrad: "from-cyan-500 to-blue-600",
        };
      case "FOOD_ADMIN":
        return {
          name: user?.fullName || "Ramesh S P",
          roleTitle: "Food Admin (Kitchen Division)",
          badge: "FOOD ADMIN",
          badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
          initials: "RS",
          avatarGrad: "from-amber-500 to-orange-500",
        };
      case "EXECUTIVE_CHEF":
        return {
          name: user?.fullName || "Chef Rajeshwar Rawat",
          roleTitle: "Executive Chef (Culinary Operations)",
          badge: "EXECUTIVE CHEF",
          badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
          initials: "RR",
          avatarGrad: "from-orange-500 to-amber-600",
        };
      case "CASHIER":
        return {
          name: user?.fullName || "Rohit Sen",
          roleTitle: "Cashier / POS Terminal",
          badge: "CASHIER",
          badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          initials: "RS",
          avatarGrad: "from-indigo-500 to-blue-600",
        };
      case "STOREKEEPER":
        return {
          name: user?.fullName || "Karthik Raja",
          roleTitle: "Storekeeper & Liquor Cellar",
          badge: "STOREKEEPER",
          badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
          initials: "KR",
          avatarGrad: "from-teal-500 to-emerald-600",
        };
      case "ACCOUNTANT":
        return {
          name: user?.fullName || "Meera Nambiar",
          roleTitle: "Accountant & GST Statutory",
          badge: "ACCOUNTANT",
          badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
          initials: "MN",
          avatarGrad: "from-rose-500 to-pink-600",
        };
      case "WAITER":
        return {
          name: user?.fullName || "Steward Raju",
          roleTitle: "Service Steward (Dining Floor)",
          badge: "WAITER",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          initials: "SR",
          avatarGrad: "from-emerald-500 to-teal-600",
        };
      default:
        return {
          name: user?.fullName || "Vikramaditya Roy",
          roleTitle: "Super Admin (General Manager)",
          badge: "SUPER ADMIN",
          badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
          initials: "VR",
          avatarGrad: "from-blue-600 to-indigo-600",
        };
    }
  };

  const profile = getProfileMeta();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. PREMIUM WHITE ENTERPRISE SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 z-30 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-1 flex items-center justify-center shadow-xs overflow-hidden">
              <img src="/logo-badge.png?v=6" alt="PUBLIQ Emblem" className="w-full h-full object-contain" />
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

        {/* Current Active Role Badge & Outlet Info */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600" /> Active Session
            </span>
            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${profile.badgeBg}`}>
              {profile.badge}
            </span>
          </div>

          <div className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 tracking-tight">PUBLIQ HARAGADDE</span>
              <span className="text-[10px] text-slate-500 font-medium">Haragadde, Bengaluru</span>
            </div>
            <Link
              href="/login"
              className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-1"
              title="Change Role"
            >
              <RefreshCw className="w-3 h-3 text-blue-600" />
              <span>Switch</span>
            </Link>
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

        {/* Footer: User Profile, Switch Role & Return Link */}
        <div className="p-3 border-t border-slate-100 bg-white space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${profile.avatarGrad} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                {profile.initials}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{profile.name}</p>
                <p className="text-[10px] text-blue-600 font-medium truncate max-w-[120px]">{profile.roleTitle}</p>
              </div>
            </div>
            <Link
              href="/login"
              className="text-[10px] px-2 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border border-slate-200 transition"
              title="Switch user role"
            >
              Switch
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100 rounded-xl transition border border-blue-200"
            >
              <Key className="w-3.5 h-3.5" /> Login Portal
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Guest Site
            </Link>
          </div>
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
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              5% GST Non-ITC Composition Mode (SAC 996331)
            </span>
          </div>

          {/* Real-Time Live Date & Time Clock (Simultaneously & Automatically Updated) */}
          <div className="hidden md:flex items-center">
            <LiveClock variant="header" />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{profile.name}</p>
              <p className="text-[10px] text-blue-600 font-semibold">{profile.roleTitle}</p>
            </div>
            <Link
              href="/login"
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${profile.avatarGrad} text-white flex items-center justify-center text-xs font-bold shadow-xs hover:scale-105 transition-transform`}
              title="Click to Switch Role or Logout"
            >
              {profile.initials}
            </Link>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="p-8 flex-1 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
