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

const FALLBACK_OWNERS: OwnerProfile[] = [
  {
    id: "owner-food-1",
    owner_name: "RAMESH S P",
    business_name: "RAMESH S P (Food Division)",
    department: "FOOD",
    upi_id: "ramesh776059@ybl",
    sac_code: "996331",
    gstin: "29AAAAA0000A1Z5",
    is_active: true
  },
  {
    id: "owner-bev-1",
    owner_name: "ANIL",
    business_name: "ANIL (Beverage & Bar Division)",
    department: "BEVERAGE",
    upi_id: "8431712924-3@ybl",
    sac_code: "996331",
    gstin: "29BBBBB1111B2Z6",
    is_active: true
  }
];

export default function AdminOwnersConfigPage() {
  const [owners, setOwners] = useState<OwnerProfile[]>(FALLBACK_OWNERS);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [savingDept, setSavingDept] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOwners = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/owners`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOwners(data);
          return;
        }
      }
      setOwners(FALLBACK_OWNERS);
    } catch (err: any) {
      setOwners(FALLBACK_OWNERS);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 lg:p-10 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>DUAL-BUSINESS GOVERNANCE & SETTLEMENT SYSTEM</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Business Proprietor Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Configure independent legal identities, SAC 996331 GST compliance, and PhonePe UPI routing for Food and Beverage operations.
            </p>
          </div>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await fetchOwners();
                setMessage({ type: "success", text: "Owner configurations synced in real time." });
                setTimeout(() => setMessage(null), 3000);
              } finally {
                setTimeout(() => setIsRefreshing(false), 600);
              }
            }}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs ${
              isRefreshing ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-95"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 transition-transform ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Settings"}</span>
          </button>
        </div>

        {/* Alerts */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
            message.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Quick Dashboard Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/owner/food"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 transition-all flex items-center justify-between group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">PROPRIETOR 1</span>
                <h3 className="font-serif text-lg font-bold text-slate-900">Food Financial Dashboard (Ramesh S P)</h3>
                <p className="text-xs text-slate-500 font-medium">View isolated kitchen revenue, food invoices, and GST reports</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="/admin/owner/beverage"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 transition-all flex items-center justify-between group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Wine className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">PROPRIETOR 2</span>
                <h3 className="font-serif text-lg font-bold text-slate-900">Beverage Financial Dashboard (Anil)</h3>
                <p className="text-xs text-slate-500 font-medium">View isolated bar revenue, drink invoices, and liquor sales</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Owner Config Cards */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading proprietor configurations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {owners.map((owner) => {
              const isFood = owner.department === "FOOD";

              return (
                <div
                  key={owner.department}
                  className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        isFood ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}>
                        {isFood ? <Utensils className="w-6 h-6" /> : <Wine className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                          isFood ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {owner.department} DIVISION
                        </span>
                        <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                          {owner.owner_name}
                        </h2>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">STATUS</span>
                      <span className={`text-xs font-bold ${owner.is_active ? "text-emerald-600" : "text-rose-600"}`}>
                        {owner.is_active ? "● ACTIVE" : "○ INACTIVE"}
                      </span>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                        Proprietor Legal Name
                      </label>
                      <input
                        type="text"
                        value={owner.owner_name}
                        onChange={(e) => handleFieldChange(owner.department, "owner_name", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                        Business Entity / Commercial Trade Name
                      </label>
                      <input
                        type="text"
                        value={owner.business_name}
                        onChange={(e) => handleFieldChange(owner.department, "business_name", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider flex items-center justify-between">
                        <span>PhonePe / UPI Virtual Payment Address (VPA)</span>
                        <span className="text-emerald-700 text-[10px] font-semibold">Verified Direct Settlement</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={owner.upi_id}
                          onChange={(e) => handleFieldChange(owner.department, "upi_id", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        All guest payments for {owner.department.toLowerCase()} items route exclusively to this UPI ID.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                          GST Service Code (SAC)
                        </label>
                        <input
                          type="text"
                          value={owner.sac_code || "996331"}
                          onChange={(e) => handleFieldChange(owner.department, "sac_code", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                          GSTIN Registration No
                        </label>
                        <input
                          type="text"
                          value={owner.gstin || "29AABCP1234F1Z9"}
                          onChange={(e) => handleFieldChange(owner.department, "gstin", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                          Contact Phone
                        </label>
                        <input
                          type="text"
                          value={owner.phone || ""}
                          onChange={(e) => handleFieldChange(owner.department, "phone", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                          Email Notification
                        </label>
                        <input
                          type="email"
                          value={owner.email || ""}
                          onChange={(e) => handleFieldChange(owner.department, "email", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSave(owner)}
                    disabled={savingDept === owner.department}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md text-white ${
                      isFood 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25 hover:shadow-lg" 
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25 hover:shadow-lg"
                    }`}
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
