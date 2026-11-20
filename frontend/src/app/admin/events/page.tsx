"use client";
import { API_BASE } from "@/lib/api";

import React, { useState, useEffect } from "react";
import { 
  PartyPopper, Users, Calendar, Phone, Mail, 
  CheckCircle2, Clock, Eye, MessageSquare, ArrowRight 
} from "lucide-react";

interface EventEnquiry {
  id: string;
  event_type: string;
  guest_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  preferred_time: string;
  guest_count: number;
  special_requests: string;
  status: string;
  created_at: string;
}

const FALLBACK_ENQUIRIES: EventEnquiry[] = [
  {
    id: "ENQ-202611-001",
    event_type: "Bespoke Birthday Celebrations",
    guest_name: "Rahul Mehra",
    phone: "+91 98110 55443",
    email: "rahul.mehra@techcorp.com",
    preferred_date: "2026-11-28",
    preferred_time: "08:00 PM",
    guest_count: 25,
    special_requests: "Fairy-light floral cabana setup, 2kg Belgian dark chocolate truffle cake, custom cocktail menu.",
    status: "NEW_INQUIRY",
    created_at: "2026-11-17T09:15:00Z"
  },
  {
    id: "ENQ-202611-002",
    event_type: "Corporate Soirées & Brand Launches",
    guest_name: "Simran Kaur",
    phone: "+91 98110 88776",
    email: "simran@innovate.in",
    preferred_date: "2026-12-05",
    preferred_time: "07:00 PM",
    guest_count: 60,
    special_requests: "Mezzanine buyout, projector setup for annual leadership presentation, live tandoor kebab platters.",
    status: "CONFIRMED",
    created_at: "2026-11-16T14:30:00Z"
  }
];

export default function AdminEventsPage() {
  const [enquiries, setEnquiries] = useState<EventEnquiry[]>(FALLBACK_ENQUIRIES);

  useEffect(() => {
    async function loadEnquiries() {
      try {
        const res = await fetch(`${API_BASE}/experience/events/enquiries`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setEnquiries(data);
        }
      } catch (_) {}
    }
    loadEnquiries();
  }, []);

  const markConfirmed = (id: string) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: "CONFIRMED" } : e));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1528]/80 p-6 rounded-3xl border border-[#38BDF8]/25 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-[#38BDF8]" />
            <h1 className="font-serif text-2xl font-bold text-white">Party & Event Enquiries</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Track and curate private birthday cabana buyouts, anniversaries, corporate celebrations, and group dining enquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-[#070E1A] border border-[#38BDF8]/30 text-xs font-semibold text-[#38BDF8]">
            {enquiries.length} Enquiries Received
          </span>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-[#0B1528]/80 rounded-3xl border border-[#38BDF8]/25 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[#38BDF8]/20">
          <h3 className="font-serif text-base font-bold text-white">Private Event Inquiry Register</h3>
        </div>

        <div className="divide-y divide-[#38BDF8]/15">
          {enquiries.map((enq) => (
            <div key={enq.id} className="p-6 space-y-4 hover:bg-[#0E1D35]/60 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#38BDF8]">{enq.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0F223D] text-[10px] font-bold text-[#38BDF8] border border-[#38BDF8]/30">
                      {enq.event_type}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-white mt-1">{enq.guest_name}</h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    enq.status === "CONFIRMED"
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                  }`}>
                    {enq.status}
                  </span>
                  {enq.status !== "CONFIRMED" && (
                    <button
                      onClick={() => markConfirmed(enq.id)}
                      className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                    >
                      Confirm Booking
                    </button>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#070E1A] border border-[#38BDF8]/20 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Target Date & Time</span>
                  <span className="font-semibold text-white">{enq.preferred_date} @ {enq.preferred_time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Guest Count</span>
                  <span className="font-semibold text-white">{enq.guest_count} Guests</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Contact Phone</span>
                  <span className="font-semibold text-white">{enq.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Email</span>
                  <span className="font-semibold text-white">{enq.email || "N/A"}</span>
                </div>
              </div>

              {/* Special Requests */}
              {enq.special_requests && (
                <div className="text-xs text-slate-300">
                  <strong className="text-[#38BDF8]">Guest Notes:</strong> {enq.special_requests}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
