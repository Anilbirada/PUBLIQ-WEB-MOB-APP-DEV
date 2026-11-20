"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Phone, Mail, Award, Clock, ArrowRight, 
  LogOut, ShieldCheck, ShoppingBag, Sparkles, CheckCircle2 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function AccountPage() {
  const { user, token, isAuthenticated, login, register, logout, isLoading } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [phoneOrEmail, setPhoneOrEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      if (token) {
        try {
          const orders = await api.getCustomerOrders(token);
          setRecentOrders(orders);
        } catch (_) {}
      }
    }
    fetchOrders();
  }, [token]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (isRegisterMode) {
        await register({
          phone: phoneOrEmail,
          full_name: fullName,
          email: email.trim() || undefined,
          password,
        });
      } else {
        await login(phoneOrEmail, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#070B12]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If Authenticated, show Profile and Order History
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-[#070B12] text-slate-100 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Card */}
          <div className="bg-[#0A111F] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#996515] text-[#070B12] flex items-center justify-center font-bold text-2xl shadow-lg">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl font-normal text-white">
                    {user.fullName}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    PUBLIQ VIP Circle
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>{user.phone}</span>
                  {user.email && <span>• {user.email}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="bg-[#0F1626] px-4 py-2.5 rounded-2xl border border-[#D4AF37]/30 text-center">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-semibold">
                  Loyalty Points
                </span>
                <span className="font-serif text-xl font-bold text-[#D4AF37]">
                  {user.loyaltyPoints} Pts
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#0F1626] border border-transparent hover:border-rose-500/30 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Past Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-normal text-white">
                Your Dining & Order History
              </h2>
              <a href="/menu" className="text-xs font-bold text-[#D4AF37] hover:underline tracking-wide">
                Explore Digital Menu →
              </a>
            </div>

            {recentOrders.length === 0 ? (
              <div className="bg-[#0A111F] rounded-2xl p-8 border border-[#D4AF37]/20 text-center space-y-3">
                <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">
                  No orders found in your account yet.
                </p>
                <a
                  href="/menu"
                  className="inline-block text-xs font-bold text-[#D4AF37] underline"
                >
                  Order now from our digital menu
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#0A111F] rounded-2xl p-5 border border-[#D4AF37]/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          #{ord.order_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                          {ord.order_status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {ord.table_number ? `Dine-In • Table ${ord.table_number}` : "Takeaway / Delivery"} • {ord.items.length} items
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="font-serif text-lg font-bold text-[#D4AF37]">
                        ₹{ord.final_amount}
                      </span>
                      <a
                        href={`/track/${ord.order_number}`}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md"
                      >
                        Track Status
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show Login / Register form
  return (
    <div className="min-h-screen bg-[#070B12] py-12 flex items-center justify-center p-4 selection:bg-[#D4AF37] selection:text-[#070B12]">
      <div className="max-w-md w-full bg-[#0A111F] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 shadow-2xl space-y-6 text-slate-100">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#0F1626] p-2 border border-[#D4AF37]/40 flex items-center justify-center mx-auto shadow-lg">
            <img src="/logo.png?v=4" alt="PUBLIQ" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-serif text-2xl font-normal text-white">
            {isRegisterMode ? "Create Customer Account" : "Sign In to PUBLIQ"}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegisterMode
              ? "Join our luxury dining circle and earn 50 welcome points."
              : "Access your order history, table reservations, and points."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
          {isRegisterMode && (
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Vikramaditya Roy"
                className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Mobile Number or Email
            </label>
            <input
              type="text"
              required
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              placeholder="9876543210 or name@domain.com"
              className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] hover:opacity-95 text-[#070B12] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#D4AF37]/20"
          >
            {isRegisterMode ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 border-t border-[#D4AF37]/15">
          {isRegisterMode ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="text-[#D4AF37] font-bold underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New to PUBLIQ?{" "}
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className="text-[#D4AF37] font-bold underline"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
