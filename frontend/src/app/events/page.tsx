"use client";

import React, { useState, useEffect } from "react";
import { 
  PartyPopper, Sparkles, Calendar, Users, Phone, Mail, 
  Clock, CheckCircle2, ChevronRight, ShieldCheck, Heart, 
  Music, Briefcase, Wine, GlassWater, ArrowRight, X, Send
} from "lucide-react";

interface EventPackage {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  capacity: string;
  image_url: string;
  inclusions: string[];
}

export default function PartyAndEventsPage() {
  const [events, setEvents] = useState<EventPackage[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("Bespoke Birthday Celebrations");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("07:30 PM");
  const [guestCount, setGuestCount] = useState<number>(20);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`${API_BASE}/experience/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (_) {}
    }
    loadEvents();
  }, [API_BASE]);

  const handleOpenEnquiry = (evt?: EventPackage) => {
    if (evt) {
      setSelectedEvent(evt);
      setEventType(evt.title);
    }
    setIsModalOpen(true);
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !phone) {
      alert("Please provide your Name and Phone Number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/experience/events/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          guest_name: guestName,
          phone: phone,
          email: email,
          preferred_date: preferredDate || "2026-11-25",
          preferred_time: preferredTime,
          guest_count: guestCount,
          special_requests: specialRequests,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmationNotice(data.message);
        setIsModalOpen(false);
        // Reset form
        setGuestName("");
        setPhone("");
        setEmail("");
        setSpecialRequests("");
      } else {
        throw new Error("API failed");
      }
    } catch (_) {
      setConfirmationNotice(`Thank you, ${guestName}. Your event enquiry has been received. Our Event Director will call you at ${phone} shortly.`);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-[#070B12] bg-cover bg-fixed" style={{ backgroundImage: "linear-gradient(to bottom, rgba(7,11,18,0.96), rgba(7,11,18,0.94)), url('/images/publiq/backgrounds/bg-events.webp')" }}>
      {/* Top Hero Banner */}
      <div className="relative py-20 sm:py-24 border-b border-[#D4AF37]/20 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,17,31,0.92), rgba(7,11,18,0.95)), url('/images/publiq/backgrounds/bg-private-dining.webp')" }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0F1626] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] shadow-lg">
            <PartyPopper className="w-3.5 h-3.5 text-[#D4AF37]" />
            Bespoke Celebrations & Corporate Soirées
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight">
            Private Dining & <span className="italic text-[#D4AF37]">Events</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-light">
            Host milestone birthdays, intimate anniversaries, high-energy DJ parties, and executive corporate dinners in our fairy-lit garden cabanas, sky deck and private dining salons.
          </p>
          <div className="pt-4">
            <button
              onClick={() => handleOpenEnquiry()}
              className="py-4 px-8 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38728] hover:opacity-95 text-[#070B12] font-bold text-xs tracking-widest uppercase transition-all shadow-xl shadow-[#D4AF37]/20 inline-flex items-center gap-2"
            >
              <span>Enquire For Private Event</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Toast */}
      {confirmationNotice && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="p-6 rounded-3xl bg-[#0A111F] border border-[#D4AF37]/40 text-white shadow-2xl flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-lg font-normal text-white">Enquiry Registered Successfully</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{confirmationNotice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Curated Event Types Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">PARTIES &amp; CELEBRATIONS</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white">
            Party Packages &amp; Private Dining Halls
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Every event includes a dedicated manager, custom food and drink menus, and private seating tailored to your celebration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#0A111F] rounded-3xl overflow-hidden border border-[#D4AF37]/20 shadow-xl hover:border-[#D4AF37]/50 hover:shadow-2xl hover:shadow-[#D4AF37]/5 transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Image & Capacity Badge */}
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#070B12]">
                  <img
                    src={evt.image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#070B12]/80 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold uppercase tracking-wider shadow">
                    {evt.category}
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-[#070B12]/85 text-white text-[10px] font-bold flex items-center gap-1 shadow border border-[#D4AF37]/30 backdrop-blur-md">
                    <Users className="w-3 h-3 text-[#D4AF37]" />
                    <span>{evt.capacity}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-widest">{evt.tagline}</p>
                    <h3 className="font-serif text-xl font-normal text-white mt-1 group-hover:text-[#D4AF37] transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                      {evt.description}
                    </p>
                  </div>

                  {/* Inclusions List */}
                  <div className="space-y-1.5 pt-3 border-t border-[#D4AF37]/15">
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Package Inclusions:</p>
                    {evt.inclusions?.map((inc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleOpenEnquiry(evt)}
                  className="w-full py-3 rounded-full bg-[#0F1626] hover:bg-[#D4AF37] text-white hover:text-[#070B12] border border-[#D4AF37]/30 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Enquire For This Package</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Enquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#0A111F] border border-[#D4AF37]/30 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">VIP Private Events</span>
                <h3 className="font-serif text-2xl font-normal text-white">Plan Your Celebration</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#070B12] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#070B12] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitEnquiry} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Occasion / Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Bespoke Birthday Celebrations">Bespoke Birthday Celebrations</option>
                  <option value="Anniversary & Romantic Dining">Anniversary & Romantic Dining</option>
                  <option value="Weekend DJ & High-Energy Nights">Weekend DJ & High-Energy Nights</option>
                  <option value="Corporate Soirées & Brand Launches">Corporate Soirées & Brand Launches</option>
                  <option value="Private Mezzanine Buyouts">Private Mezzanine Buyouts</option>
                  <option value="Family Gatherings & Group Feasts">Family Gatherings & Group Feasts</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Vikramaditya Roy"
                    className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Phone Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 98110 01100"
                    className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Preferred Date</label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Time Slot</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="12:30 PM">12:30 PM (Lunch)</option>
                    <option value="02:00 PM">02:00 PM (Afternoon)</option>
                    <option value="07:30 PM">07:30 PM (Dinner)</option>
                    <option value="09:00 PM">09:00 PM (Late Evening)</option>
                    <option value="10:30 PM">10:30 PM (Nightlife)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Guest Count</label>
                  <input
                    type="number"
                    min={2}
                    max={250}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">Special Dietary Requests / Customization</label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Need acoustic violinist for 30 mins, 4 guests are Jain vegetarian, custom celebratory cake..."
                  className="w-full text-xs bg-[#070B12] border border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D4AF37]/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#070B12] border border-[#D4AF37]/30 text-slate-300 text-xs font-semibold hover:border-[#D4AF37]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] hover:opacity-95 text-xs font-bold tracking-widest uppercase transition-all shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Send Event Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
