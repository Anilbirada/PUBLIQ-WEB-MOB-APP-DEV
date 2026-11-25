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
import { useTableSession } from "../../context/TableSessionContext";

export default function UniversalLoginPage() {
  const router = useRouter();
  const { universalLogin } = useAuth();
  const { clearTableSession } = useTableSession();

  // Clear any active customer table session when entering staff/admin portal
  React.useEffect(() => {
    clearTableSession();
  }, []);

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setErrorMsg("Please select your Department / Access Terminal from the dropdown.");
      return;
    }
    if (!identifier.trim()) {
      setErrorMsg("Please enter your registered staff username, email, or mobile number.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your staff password or security PIN.");
      return;
    }

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
      const targetDestination = user.redirectUrl || (
        user.role === "WAITER" ? "/waiter" :
        user.role === "BAR_ADMIN" ? "/admin/owner/beverage" :
        user.role === "FOOD_ADMIN" ? "/admin/owner/food" :
        user.role === "CUSTOMER" ? "/menu" : "/admin"
      );
      setSuccessMsg(`Welcome, ${user.fullName}! Authenticated as ${user.roleLabel}. Redirecting to your terminal...`);
      setTimeout(() => {
        router.push(targetDestination);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your department terminal selection and login details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-800 font-sans selection:bg-blue-600 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-white p-2 border border-slate-200 shadow-xs flex items-center justify-center">
            <img src="/logo.png?v=4" alt="PUBLIQ Emblem" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-blue-700 block">
              PUBLIQ ENTERPRISE MANAGEMENT
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Staff &amp; Administrator Portal Login
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-medium">
              Enter your registered staff username, email, or mobile number along with your password or security PIN to access your department terminal.
            </p>
          </div>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 max-w-md mx-auto shadow-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 max-w-md mx-auto shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SECURE STAFF CREDENTIALS FORM */}
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Authentication Terminal
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">
                  Direct Database-Verified Session
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
              RBAC v2.4
            </span>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {/* Department / Role Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Department / Access Terminal <span className="text-amber-600 font-bold">* (Required)</span>
              </label>
              <select
                required
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition cursor-pointer"
              >
                <option value="">-- Select Department / Access Role --</option>
                <option value="SUPER_ADMIN">Super Admin (All Modules &amp; Full Governance)</option>
                <option value="BAR_ADMIN">Bar Admin (Beverage Division - Restricted)</option>
                <option value="FOOD_ADMIN">Kitchen Admin (Food Division - Restricted)</option>
                <option value="WAITER">Service Steward (Dining Floor - Restricted)</option>
                <option value="CUSTOMER">Guest Customer Portal (Restricted)</option>
              </select>
            </div>

            {/* Username / Identifier */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Staff Username, Email, or Mobile
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter staff username, email, or mobile number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password or PIN */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Password or Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter employee password or security PIN"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Enterprise Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-bit encrypted authentication. All sessions are logged with staff ID and timestamp.</span>
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
