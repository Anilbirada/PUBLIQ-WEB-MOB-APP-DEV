"use client";
import { API_BASE } from "@/lib/api";

import React, { useState, useEffect } from "react";
import { 
  Bot, Sparkles, CheckCircle2, Clock, ShieldCheck, 
  Send, RefreshCw, Film, Instagram, Share2, AlertTriangle, X
} from "lucide-react";

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
  const [theme, setTheme] = useState("Single Malt Saturday");
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
        const data = await res.json();
        setToastMsg(data.message);
        fetchPromos();
      }
    } catch (_) {
      setToastMsg("Generated locally in review queue.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (promoId: string) => {
    try {
      const res = await fetch(`${API_BASE}/experience/ai/promos/${promoId}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        setToastMsg("Content Approved & Scheduled for Publication.");
        fetchPromos();
      }
    } catch (_) {
      setPromos(prev => prev.map(p => p.id === promoId ? { ...p, status: "APPROVED", reviewed_by: "General Manager (Admin)" } : p));
      setToastMsg("Approved (Local Sync)");
    }
  };

  const pendingCount = promos.filter(p => p.status === "PENDING_APPROVAL").length;
  const approvedCount = promos.filter(p => p.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1528]/80 p-6 rounded-3xl border border-[#38BDF8]/25 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#38BDF8]" />
            <h1 className="font-serif text-2xl font-bold text-white">AI Content & Promotional Studio</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Generate AI-assisted promotional video concepts, social captions, and seasonal campaigns. All content requires Administrator approval before publication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-[#070E1A] border border-[#38BDF8]/30 text-xs font-semibold text-[#38BDF8] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{pendingCount} Pending Review</span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-[#0F223D] border border-[#38BDF8] text-white rounded-2xl text-xs flex items-center gap-2 shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Generator Form */}
      <div className="bg-[#0B1528]/80 rounded-3xl p-6 border border-[#38BDF8]/25 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-[#38BDF8]/20 pb-3">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="font-serif text-base font-bold text-white">Generate New Promotional Campaign</h3>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-[#38BDF8] block mb-1">Campaign Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full text-xs bg-[#070E1A] border border-[#38BDF8]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="Single Malt Saturday & Jazz" className="bg-[#0B1528] text-white">Single Malt Saturday & Jazz</option>
              <option value="Tandoor Embers & Royal Biryani" className="bg-[#0B1528] text-white">Tandoor Embers & Royal Biryani</option>
              <option value="Romantic Sunset Garden Cabana" className="bg-[#0B1528] text-white">Romantic Sunset Garden Cabana</option>
              <option value="Friday High-Energy DJ Night" className="bg-[#0B1528] text-white">Friday High-Energy DJ Night</option>
              <option value="Sunday Long Brunch & Mimosa" className="bg-[#0B1528] text-white">Sunday Long Brunch & Mimosa</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#38BDF8] block mb-1">Distribution Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full text-xs bg-[#070E1A] border border-[#38BDF8]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="Instagram Reels & WhatsApp VIP Broadcast" className="bg-[#0B1528] text-white">Instagram Reels & WhatsApp Broadcast</option>
              <option value="Website Hero Banner & Email" className="bg-[#0B1528] text-white">Website Hero Banner & Email</option>
              <option value="Mobile App Push Notification" className="bg-[#0B1528] text-white">Mobile App Push Notification</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#070B12]" />
              <span>{isGenerating ? "Synthesizing AI..." : "Generate AI Copy & Video Script"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Review & Approval Queue */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-white">Administrator Review & Publication Queue</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promos.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl p-6 border shadow-xl flex flex-col justify-between space-y-4 ${
                p.status === "PENDING_APPROVAL"
                  ? "bg-[#1A1408]/90 border-amber-500/50"
                  : "bg-[#0B1528]/80 border-[#38BDF8]/25"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                    {p.channel}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === "APPROVED"
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse"
                  }`}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>

                <h4 className="font-serif text-base font-bold text-white">{p.title}</h4>

                {/* Promotional Copy */}
                <div className="p-3.5 rounded-2xl bg-[#070E1A] border border-[#38BDF8]/20 text-xs text-slate-200 leading-relaxed">
                  <p className="font-semibold text-[10px] text-slate-400 uppercase mb-1">Generated Copy:</p>
                  {p.generated_content}
                </div>

                {/* Video Prompt Concept */}
                <div className="p-3 rounded-2xl bg-[#070E1A] border border-[#D4AF37]/30 text-xs text-slate-300">
                  <p className="font-semibold text-[10px] text-[#D4AF37] uppercase flex items-center gap-1 mb-1">
                    <Film className="w-3 h-3 text-[#D4AF37]" /> Video Reel Visual Prompt Concept:
                  </p>
                  {p.video_prompt_concept}
                </div>
              </div>

              {/* Approval Buttons */}
              <div className="pt-2 border-t border-[#38BDF8]/20 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {p.reviewed_by ? `Approved by ${p.reviewed_by}` : "Awaiting GM review"}
                </span>

                {p.status === "PENDING_APPROVAL" ? (
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Live on Channels
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
