"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Wine, UtensilsCrossed, Smartphone, User, 
  ArrowRight, Key, Mail, Lock, CheckCircle2, AlertCircle, 
  Sparkles, Check, ChevronRight, Eye, EyeOff, Store, Phone, LogIn
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function UniversalLoginPage() {
  const router = useRouter();
  const { universalLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<"roles" | "credentials">("roles");
  const [selectedRole, setSelectedRole] = useState<string>("SUPER_ADMIN");
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const roles = [
    {
      id: "SUPER_ADMIN",
      title: "Super Admin",
      subtitle: "Executive Management & Full Platform Governance",
      department: "ALL DEPARTMENTS",
      badgeColor: "from-blue-600 to-indigo-600",
      accentBorder: "border-blue-500",
      lightBg: "bg-blue-50/60",
      icon: ShieldCheck,
      iconColor: "text-blue-600",
      user: "Vikramaditya Roy (GM)",
      credentials: "Email: admin@publiq.in • PIN: 9999",
      destination: "/admin",
      description: "Complete unconstrained access across all modules: POS, KDS, Bar, Tables, QR Tokens, Inventory, Dual Owners, Reviews, and 5% GST Reports.",
      permissions: [
        "Executive Analytics & Performance",
        "Restaurant & Bar POS Terminal",
        "Kitchen KDS & Bar Dispense Station",
        "Table QR Plaques & Floor Plan Management",
        "Dual-Business Governance (Anil & Ramesh Portals)",
        "Liquor Cellar & Kitchen Raw Materials",
        "Customer Reviews Moderation Hub"
      ]
    },
    {
      id: "BAR_ADMIN",
      title: "Bar Admin (Anil)",
      subtitle: "Artisan Beverage & Liquor Division",
      department: "BEVERAGE DIVISION",
      badgeColor: "from-cyan-500 to-blue-600",
      accentBorder: "border-cyan-500",
      lightBg: "bg-cyan-50/60",
      icon: Wine,
      iconColor: "text-cyan-600",
      user: "Anil (Proprietor)",
      credentials: "PhonePe: 8431712924-3@ybl • PIN: 8888",
      destination: "/admin/owner/beverage",
      description: "Dedicated to bar operations, cocktail dispense stations, liquor cellar mL ledger, and Anil's isolated PhonePe direct settlement portal.",
      permissions: [
        "Anil Bar Financial Portal & Drinks Invoices",
        "Official PhonePe Settlement QR (8431712924-3@ybl)",
        "Bar Dispense Station & Mixology Queue",
        "Liquor Cellar & Bottle mL Peg Ledger",
        "Beverage-Only Orders & Invoicing"
      ]
    },
    {
      id: "FOOD_ADMIN",
      title: "Kitchen / Food Admin (Ramesh S P)",
      subtitle: "Culinary & Dining Operations Division",
      department: "FOOD DIVISION",
      badgeColor: "from-amber-500 to-orange-500",
      accentBorder: "border-amber-500",
      lightBg: "bg-amber-50/60",
      icon: UtensilsCrossed,
      iconColor: "text-amber-600",
      user: "Ramesh S P (Proprietor)",
      credentials: "PhonePe: ramesh776059@ybl • PIN: 7778",
      destination: "/admin/owner/food",
      description: "Dedicated to kitchen food lines, Kitchen Display System (KDS), raw material inventory, and Ramesh's isolated PhonePe direct settlement portal.",
      permissions: [
        "Ramesh S P Food Financial Portal & Invoices",
        "Official PhonePe Settlement QR (ramesh776059@ybl)",
        "Kitchen Display System (KDS) & Cook Stations",
        "Kitchen Raw Materials & Minimum Thresholds",
        "Culinary-Only Orders & Invoicing"
      ]
    },
    {
      id: "WAITER",
      title: "Service Steward (Waiter)",
      subtitle: "Dining Floor Table & Order Taking",
      department: "FLOOR SERVICE",
      badgeColor: "from-emerald-500 to-teal-600",
      accentBorder: "border-emerald-500",
      lightBg: "bg-emerald-50/60",
      icon: Smartphone,
      iconColor: "text-emerald-600",
      user: "Steward Raju (Staff)",
      credentials: "Mobile PIN: 6666",
      destination: "/waiter",
      description: "Interactive waiter terminal for taking guest table orders, scanning table QR brass plaques, viewing floor maps, and managing bill settlement.",
      permissions: [
        "Live Table Floor Plan & Seating Status",
        "Physical Camera QR Table Scanner",
        "Digital Order Taking (+POS Quick Add)",
        "KOT Ticket Dispatch to Tandoor & Bar",
        "Dual-Invoice Generation & Table Settlement"
      ]
    },
    {
      id: "CUSTOMER",
      title: "Guest / Customer",
      subtitle: "Self-Service Digital Dining Experience",
      department: "GUEST DINER",
      badgeColor: "from-purple-600 to-pink-500",
      accentBorder: "border-purple-500",
      lightBg: "bg-purple-50/60",
      icon: User,
      iconColor: "text-purple-600",
      user: "Valued Guest Diner",
      credentials: "1-Click Direct Guest Access",
      destination: "/menu",
      description: "Browse the complete 281-creation food and drinks catalogue, place orders from table QR plaques, live track preparation, and submit 5-star reviews.",
      permissions: [
        "Interactive Digital Food & Drinks Menu",
        "Table QR Dine-In Ordering",
        "Split Cart Review (Food vs Beverage)",
        "Live Order Tracking Timeline",
        "5-Star Dining Review Submission"
      ]
    }
  ];

  const handleQuickRoleLogin = async (roleId: string, destination: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await universalLogin({
        role: roleId,
        is_quick_demo: true
      });
      setSuccessMsg(`Welcome, ${user.fullName}! Redirecting to ${user.roleLabel} portal...`);
      setTimeout(() => {
        router.push(destination);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Redirecting to portal...");
      setTimeout(() => {
        router.push(destination);
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await universalLogin({
        role: selectedRole,
        identifier: identifier.trim(),
        password: password.trim(),
        pin: password.trim()
      });
      setSuccessMsg(`Authenticated as ${user.fullName} (${user.roleLabel})! Redirecting...`);
      setTimeout(() => {
        router.push(user.redirectUrl || "/admin");
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your username and password/PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-600 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-white p-2 border border-slate-200 shadow-xs flex items-center justify-center">
            <img src="/logo.png?v=4" alt="PUBLIQ Emblem" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-blue-700 block">
              PUBLIQ ENTERPRISE PLATFORM
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Role-Based Authentication & Access Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">
              Select your role below or enter your employee credentials to access your designated department dashboard.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs gap-1.5">
              <button
                onClick={() => setActiveTab("roles")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "roles"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>1-Click Role Switcher (Fast Demo)</span>
              </button>
              <button
                onClick={() => setActiveTab("credentials")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "credentials"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Staff Username & PIN Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 max-w-2xl mx-auto shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 max-w-2xl mx-auto shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: 1-CLICK ROLE SWITCHER (5 ROLES) */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Choose one of 5 enterprise roles to enter its portal with specific privileges
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6 space-y-4">
                      {/* Top Role Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.badgeColor} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${r.lightBg} ${r.iconColor} border-current/20`}>
                          {r.department}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-lg font-bold text-slate-900">
                          {r.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {r.subtitle}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {r.description}
                      </p>

                      {/* Permissions List */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Granted Access:
                        </span>
                        {r.permissions.slice(0, 3).map((perm, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{perm}</span>
                          </div>
                        ))}
                      </div>

                      {/* Default Credential Note */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-mono">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Fast Login Profile:</span>
                        <strong className="text-slate-800">{r.user}</strong> • {r.credentials}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                      <button
                        onClick={() => handleQuickRoleLogin(r.id, r.destination)}
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${r.badgeColor} text-white font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2`}
                      >
                        <span>Login as {r.title.split(" ")[0]}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CREDENTIALS LOGIN FORM */}
        {activeTab === "credentials" && (
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Staff & Employee Login
              </h2>
              <p className="text-xs text-slate-500">
                Enter your credentials or standard employee PIN
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Select Login Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 transition"
                >
                  <option value="SUPER_ADMIN">Super Admin (All Modules)</option>
                  <option value="BAR_ADMIN">Bar Admin - Anil (Beverage Division)</option>
                  <option value="FOOD_ADMIN">Kitchen / Food Admin - Ramesh S P (Food Division)</option>
                  <option value="WAITER">Service Steward - Raju (Waiter Terminal)</option>
                  <option value="CUSTOMER">Guest Diner (Customer Ordering)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Email, Phone, or Identifier
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. admin@publiq.in or 8431712924 or 7760590000"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Password or 4-Digit PIN</span>
                  <span className="text-[10px] text-blue-600 font-mono">Demo PIN: 9999 / 8888 / 7778 / 6666</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter employee password or PIN"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Authorize &amp; Launch Portal</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center space-y-2">
              <span className="text-[11px] text-slate-400 block font-medium">Standard Roster Quick PINs:</span>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Admin: 9999</span>
                <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">Bar: 8888</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Kitchen: 7778</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Waiter: 6666</span>
              </div>
            </div>
          </div>
        )}

        {/* 5-Role Access Control Matrix Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600" />
              Role-Based Access Control (RBAC) Specification
            </h3>
            <span className="text-xs text-blue-600 font-semibold">5 Defined Roles</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="p-3">Role</th>
                  <th className="p-3">Operational Scope</th>
                  <th className="p-3">Primary Portal</th>
                  <th className="p-3">PhonePe / Settlement</th>
                  <th className="p-3">Access Restrictions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-blue-700">Super Admin</td>
                  <td className="p-3 text-slate-600">All Modules, POS, KDS, Bar, Inventory, Reports, Users</td>
                  <td className="p-3 font-mono text-slate-900">/admin</td>
                  <td className="p-3 text-slate-600">Consolidated Indian 5% GST Reports</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">Unrestricted (Full)</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-cyan-700">Bar Admin (Anil)</td>
                  <td className="p-3 text-slate-600">Bar Dispense Station, Cocktails, Liquor Cellar &amp; Peg Ledger</td>
                  <td className="p-3 font-mono text-slate-900">/admin/owner/beverage</td>
                  <td className="p-3 font-mono text-cyan-700 font-bold">8431712924-3@ybl</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold text-[10px]">Restricted to Beverages</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-amber-700">Food Admin (Ramesh)</td>
                  <td className="p-3 text-slate-600">Kitchen Display (KDS), Clay Tandoor Lines, Raw Materials</td>
                  <td className="p-3 font-mono text-slate-900">/admin/owner/food</td>
                  <td className="p-3 font-mono text-amber-700 font-bold">ramesh776059@ybl</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">Restricted to Food</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-emerald-700">Service Steward</td>
                  <td className="p-3 text-slate-600">Floor Seating Map, Taking Orders, QR Scanning, KOT Dispatch</td>
                  <td className="p-3 font-mono text-slate-900">/waiter</td>
                  <td className="p-3 text-slate-600">Cash / EDC / UPI Dual Split Collection</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">Dining Floor Only</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-purple-700">Guest / Customer</td>
                  <td className="p-3 text-slate-600">Browse Digital Menu, Table QR Ordering, Live Order Tracking</td>
                  <td className="p-3 font-mono text-slate-900">/menu</td>
                  <td className="p-3 text-slate-600">Table PhonePe QR Payment (Split Invoices)</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">Self-Service Diner</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Back to Public Site Footer */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors"
          >
            <span>← Return to Public Guest Website</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
