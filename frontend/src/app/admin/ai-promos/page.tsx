"use client";

import React, { useState, useEffect } from "react";
import { 
  Bot, Sparkles, CheckCircle2, Clock, ShieldCheck, 
  Send, RefreshCw, Film, Instagram, Share2, AlertTriangle, X
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface AiPromo {
  id: string;
  title: string;
  channel: string;
  content_type: string;
  generated_content: string;
  video_prompt_concept: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "PUBLISHED";
  created_at: string;
  reviewed_by?: string;
}

export default function AdminAiPromosPage() {
  const [promos, setPromos] = useState<AiPromo[]>([]);
  const [theme, setTheme] = useState("Single Malt Saturday & Jazz");
  const [channel, setChannel] = useState("Instagram Reels & WhatsApp VIP Broadcast");
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchPromos = async () => {
    try {
      const res = await fetch(`${API_BASE}/experience/ai/promos`);
      if (res.ok) {
        const data = await res.json();
        setPromos(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/experience/ai/generate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, channel })
      });
      if (res.ok) {
        const newPromo = await res.json();
        setPromos(prev => [newPromo, ...prev]);
        setToastMsg("AI promotional campaign drafted successfully!");
      }
    } catch (_) {
      // Local demo fallback
      const mockPromo: AiPromo = {
        id: `promo-${Date.now()}`,
        title: `${theme} • Signature Experience`,
        channel,
        content_type: "REEL_PROMO",
        generated_content: `Immerse your senses in an extraordinary evening at PUBLIQ. Savor handcrafted cocktails and royal charcoal kebabs. Reserve your table now for priority seating.`,
        video_prompt_concept: `Cinematic slow-motion shot of crystal glassware and flame-kissed tandoor skewers under warm amber lighting.`,
        status: "PENDING_APPROVAL",
        created_at: new Date().toISOString()
      };
      setPromos(prev => [mockPromo, ...prev]);
      setToastMsg("AI promotional draft created (Ready for Review).");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/experience/ai/promos/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "General Manager" })
      });
      if (res.ok) {
        setPromos(prev => prev.map(p => p.id === id ? { ...p, status: "APPROVED", reviewed_by: "General Manager" } : p));
        setToastMsg("Promotional copy approved and marked for broadcast!");
      }
    } catch (_) {
      setPromos(prev => prev.map(p => p.id === id ? { ...p, status: "APPROVED", reviewed_by: "General Manager" } : p));
      setToastMsg("Approved (Local Sync)");
    }
  };

  const pendingCount = promos.filter(p => p.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="w-3.5 h-3.5" />
              AI Creative Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              AI Content &amp; Promotional Studio
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate AI-assisted promotional video concepts, social captions, and seasonal campaigns. All content requires Administrator approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{pendingCount} Pending Review</span>
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
        )}

        {/* Generator Form */}
        <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Generate New Promotional Campaign</h3>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Campaign Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="Single Malt Saturday & Jazz">Single Malt Saturday &amp; Jazz</option>
                <option value="Tandoor Embers & Royal Biryani">Tandoor Embers &amp; Royal Biryani</option>
                <option value="Romantic Sunset Garden Cabana">Romantic Sunset Garden Cabana</option>
                <option value="Friday High-Energy DJ Night">Friday High-Energy DJ Night</option>
                <option value="Sunday Long Brunch & Mimosa">Sunday Long Brunch &amp; Mimosa</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Distribution Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="Instagram Reels & WhatsApp VIP Broadcast">Instagram Reels &amp; WhatsApp Broadcast</option>
                <option value="Website Hero Banner & Email">Website Hero Banner &amp; Email</option>
                <option value="Mobile App Push Notification">Mobile App Push Notification</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? "Synthesizing AI..." : "Generate AI Copy & Script"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Review & Approval Queue */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Administrator Review &amp; Publication Queue</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promos.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl p-6 border shadow-xs flex flex-col justify-between space-y-4 ${
                p.status === "PENDING_APPROVAL"
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-white border-slate-200/80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {p.channel}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                  }`}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900">{p.title}</h4>

                {/* Promotional Copy */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  <p className="font-semibold text-[10px] text-slate-400 uppercase mb-1">Generated Copy:</p>
                  {p.generated_content}
                </div>

                {/* Video Prompt Concept */}
                <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900">
                  <p className="font-semibold text-[10px] text-amber-700 uppercase flex items-center gap-1 mb-1">
                    <Film className="w-3 h-3 text-amber-600" /> Video Reel Visual Prompt Concept:
                  </p>
                  {p.video_prompt_concept}
                </div>
              </div>

              {/* Approval Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {p.reviewed_by ? `Approved by ${p.reviewed_by}` : "Awaiting GM review"}
                </span>

                {p.status === "PENDING_APPROVAL" ? (
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Publish</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Live on Channels
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
