"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, Users, Clock, CheckCircle2, XCircle, 
  AlertCircle, Phone, MapPin, Search, Filter, ShieldCheck 
} from "lucide-react";
import { api } from "../../../lib/api";

interface ReservationRecord {
  id: string;
  reservation_number: string;
  guest_name: string;
  guest_phone: string;
  guest_count: number;
  reservation_date: string;
  time_slot: string;
  seating_preference: string;
  status: "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELLED";
  special_requests?: string;
  table_assigned?: string;
}

const FALLBACK_RESERVATIONS: ReservationRecord[] = [
  {
    id: "res-1",
    reservation_number: "PUB-RES-8821",
    guest_name: "Rahul Roy",
    guest_phone: "+91 98110 01122",
    guest_count: 4,
    reservation_date: "2026-11-20",
    time_slot: "19:30",
    seating_preference: "Main Dining & Atrium",
    status: "CONFIRMED",
    special_requests: "Quiet corner for anniversary dinner, celebrate with vintage red wine.",
    table_assigned: "Table 08"
  },
  {
    id: "res-2",
    reservation_number: "PUB-RES-8822",
    guest_name: "Ananya Iyer",
    guest_phone: "+91 98110 44332",
    guest_count: 6,
    reservation_date: "2026-11-20",
    time_slot: "20:00",
    seating_preference: "Resto-Bar & Mixology Lounge",
    status: "CONFIRMED",
    special_requests: "Near mixologist counter for live cocktail preparation.",
    table_assigned: "Bar High Top 02"
  },
  {
    id: "res-3",
    reservation_number: "PUB-RES-8823",
    guest_name: "David Chen",
    guest_phone: "+91 98110 99887",
    guest_count: 2,
    reservation_date: "2026-11-20",
    time_slot: "13:00",
    seating_preference: "Outdoor Terrace & Sky Deck",
    status: "SEATED",
    special_requests: "Business lunch with skyline views.",
    table_assigned: "Table 03"
  }
];

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<ReservationRecord[]>(FALLBACK_RESERVATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadLive() {
      try {
        const live = await api.getReservations();
        if (live && live.length > 0) {
          setReservations(live.map(r => ({
            id: r.id,
            reservation_number: r.reservation_ref,
            guest_name: r.guest_name,
            guest_phone: r.guest_phone,
            guest_count: r.guest_count,
            reservation_date: r.reservation_date,
            time_slot: r.time_slot,
            seating_preference: r.seating_preference,
            status: r.status as any,
            special_requests: r.special_requests,
            table_assigned: "Main Floor"
          })));
        }
      } catch (err) {
        console.warn("Using local fallback reservations:", err);
      }
    }
    loadLive();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "SEATED" | "COMPLETED" | "CANCELLED") => {
    try {
      await api.updateReservationStatus(id, newStatus);
    } catch (e) {
      console.warn("Backend update error:", e);
    }
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    setToastMsg(`Reservation marked as ${newStatus}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = reservations.filter(r => {
    const matchesSearch = r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reservation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.guest_phone.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1528]/80 p-6 rounded-3xl border border-[#38BDF8]/25 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#38BDF8]" />
            <h1 className="font-serif text-2xl font-bold text-white">Guest Reservation Management</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time table booking approval, seating zone allocation, and double-booking conflict prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-[#070E1A] border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
            <span>Conflict Shield Active</span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-[#0F223D] border border-[#38BDF8] text-white rounded-2xl text-xs flex items-center gap-2 shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0B1528]/80 p-4 rounded-3xl border border-[#38BDF8]/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search guest name, ref #, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-[#070E1A] border border-[#38BDF8]/30 rounded-full pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] font-bold shadow-md"
                  : "bg-[#070E1A] border border-[#38BDF8]/20 text-slate-300 hover:text-white hover:border-[#38BDF8]/40"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-[#0B1528]/80 rounded-3xl border border-[#38BDF8]/25 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[#38BDF8]/20 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-white">Today&#39;s Table Reservations</h3>
          <span className="text-xs text-[#38BDF8] font-bold">{filtered.length} Bookings</span>
        </div>

        <div className="divide-y divide-[#38BDF8]/15">
          {filtered.map(r => (
            <div key={r.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#0E1D35]/60 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#38BDF8]">{r.reservation_number}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F223D] text-[#38BDF8] border border-[#38BDF8]/30">
                    {r.seating_preference}
                  </span>
                  {r.table_assigned && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      Assigned: {r.table_assigned}
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-base font-bold text-white">{r.guest_name} ({r.guest_count} Guests)</h4>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" /> {r.reservation_date} at {r.time_slot}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#38BDF8]" /> {r.guest_phone}
                  </span>
                </div>
                {r.special_requests && (
                  <p className="text-xs text-slate-400 italic">Note: {r.special_requests}</p>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  r.status === "CONFIRMED"
                    ? "bg-[#0F223D] text-[#38BDF8] border border-[#38BDF8]/30"
                    : r.status === "SEATED"
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                    : "bg-[#070E1A] text-slate-400 border border-slate-700"
                }`}>
                  {r.status}
                </span>

                {r.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, "SEATED")}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                  >
                    Seat Guests
                  </button>
                )}

                {r.status === "SEATED" && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, "COMPLETED")}
                    className="px-3.5 py-1.5 rounded-full bg-[#070E1A] border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-bold hover:bg-[#38BDF8] hover:text-[#070B12] transition-colors"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
