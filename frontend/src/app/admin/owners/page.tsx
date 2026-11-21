"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, UserCheck, ShieldCheck, CreditCard, Save, 
  RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Utensils, Wine
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface OwnerProfile {
  id: string;
  department: string;
  owner_name: string;
  business_name: string;
  upi_id: string;
  qr_image_url?: string;
  phone?: string;
  email?: string;
  sac_code: string;
  gstin?: string;
  is_active: boolean;
}

export default function AdminOwnersConfigPage() {
  const [owners, setOwners] = useState<OwnerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingDept, setSavingDept] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/owners`);
      if (res.ok) {
        const data = await res.json();
        setOwners(data);
      } else {
        throw new Error("Failed to load business owners");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load owner configurations." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleFieldChange = (dept: string, field: keyof OwnerProfile, value: any) => {
    setOwners(prev => prev.map(o => o.department === dept ? { ...o, [field]: value } : o));
  };

  const handleSave = async (owner: OwnerProfile) => {
    setSavingDept(owner.department);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/admin/owners/${owner.department}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_name: owner.owner_name,
          business_name: owner.business_name,
          upi_id: owner.upi_id,
          phone: owner.phone,
          email: owner.email,
          sac_code: owner.sac_code,
          gstin: owner.gstin,
          is_active: owner.is_active
        })
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Settings for ${owner.department} (${owner.owner_name}) saved successfully!` });
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Save failed");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update owner configuration." });
    } finally {
      setSavingDept(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#D4AF37]/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>DUAL-BUSINESS GOVERNANCE &amp; SETTLEMENT SYSTEM</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white mt-1">
              Business Proprietor Configuration
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure independent legal identities, SAC 996331 GST compliance, and PhonePe UPI routing for Food and Beverage operations.
            </p>
          </div>
          <button
            onClick={fetchOwners}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1626] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] hover:bg-[#151F33] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Settings</span>
          </button>
        </div>

        {/* Alerts */}
        {message && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
            message.type === "success" 
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" 
              : "bg-rose-950/60 border-rose-500/40 text-rose-300"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Quick Dashboard Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/owner/food"
            className="p-5 rounded-2xl bg-gradient-to-r from-[#0D1527] to-[#121B30] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#070B12] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">PROPRIETOR 1</span>
                <h3 className="font-serif text-lg font-bold text-white">Food Financial Dashboard (Anil)</h3>
                <p className="text-xs text-slate-400">View isolated kitchen revenue, food invoices, and GST reports</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="/admin/owner/beverage"
            className="p-5 rounded-2xl bg-gradient-to-r from-[#0D1527] to-[#121B30] border border-[#38BDF8]/30 hover:border-[#38BDF8] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#070B12] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                <Wine className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">PROPRIETOR 2</span>
                <h3 className="font-serif text-lg font-bold text-white">Beverage Financial Dashboard (Ramesh)</h3>
                <p className="text-xs text-slate-400">View isolated bar revenue, drink invoices, and liquor sales</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#38BDF8] group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Owner Config Cards */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading proprietor configurations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {owners.map((owner) => {
              const isFood = owner.department === "FOOD";
              const accentColor = isFood ? "#D4AF37" : "#38BDF8";

              return (
                <div
                  key={owner.department}
                  className="bg-[#0A111F] rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6"
                  style={{ borderColor: `${accentColor}40` }}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                        style={{ backgroundColor: "#070B12", borderColor: accentColor }}
                      >
                        {isFood ? <Utensils className="w-6 h-6 text-[#D4AF37]" /> : <Wine className="w-6 h-6 text-[#38BDF8]" />}
                      </div>
                      <div>
                        <span
                          className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${accentColor}15`,
                            color: accentColor,
                            border: `1px solid ${accentColor}40`
                          }}
                        >
                          {owner.department} DIVISION
                        </span>
                        <h2 className="font-serif text-2xl font-bold text-white mt-1">
                          {owner.owner_name}
                        </h2>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">STATUS</span>
                      <span className={`text-xs font-bold ${owner.is_active ? "text-emerald-400" : "text-rose-400"}`}>
                        {owner.is_active ? "● ACTIVE" : "○ INACTIVE"}
                      </span>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                        Proprietor Legal Name
                      </label>
                      <input
                        type="text"
                        value={owner.owner_name}
                        onChange={(e) => handleFieldChange(owner.department, "owner_name", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#070B12] border border-slate-800 text-white font-medium focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                        Business Entity / Commercial Trade Name
                      </label>
                      <input
                        type="text"
                        value={owner.business_name}
                        onChange={(e) => handleFieldChange(owner.department, "business_name", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#070B12] border border-slate-800 text-white font-medium focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider flex items-center justify-between">
                        <span>PhonePe / UPI Virtual Payment Address (VPA)</span>
                        <span className="text-emerald-400 text-[10px]">Verified Direct Settlement</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={owner.upi_id}
                          onChange={(e) => handleFieldChange(owner.department, "upi_id", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#070B12] border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        All guest payments for {owner.department.toLowerCase()} items route exclusively to this UPI ID.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                          GST Service Code (SAC)
                        </label>
                        <input
                          type="text"
                          value={owner.sac_code || "996331"}
                          onChange={(e) => handleFieldChange(owner.department, "sac_code", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#070B12] border border-slate-800 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                          GSTIN Registration No
                        </label>
                        <input
                          type="text"
                          value={owner.gstin || "29AABCP1234F1Z9"}
                          onChange={(e) => handleFieldChange(owner.department, "gstin", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#070B12] border border-slate-800 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                          Contact Phone
                        </label>
                        <input
                          type="text"
                          value={owner.phone || ""}
                          onChange={(e) => handleFieldChange(owner.department, "phone", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#070B12] border border-slate-800 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                          Email Notification
                        </label>
                        <input
                          type="email"
                          value={owner.email || ""}
                          onChange={(e) => handleFieldChange(owner.department, "email", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#070B12] border border-slate-800 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSave(owner)}
                    disabled={savingDept === owner.department}
                    className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
                    style={{
                      backgroundColor: accentColor,
                      color: "#070B12"
                    }}
                  >
                    {savingDept === owner.department ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving {owner.department} Settings...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save {owner.owner_name} Settings</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
