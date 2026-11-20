"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  ShoppingBag, Menu as MenuIcon, X, Calendar, UtensilsCrossed, 
  Wine, Sparkles, MapPin, Phone, Clock, ArrowRight, ShieldCheck
} from "lucide-react";
import { useTableSession } from "../context/TableSessionContext";
import { useCart } from "../context/CartContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { tableNumber, diningArea, isDineInActive, clearTableSession } = useTableSession();
  const { itemCount } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close drawer when path changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Track scroll position for transparent -> dark luxury sticky transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Suppress public navbar inside admin portal
  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) {
    return null;
  }

  const drawerLinks = [
    { number: "01", label: "Home", href: "/", desc: "Welcome to PUBLIQ Bar & Restaurant" },
    { number: "02", label: "Our Story", href: "/#story", desc: "Our passion for authentic Indian food & hospitality" },
    { number: "03", label: "Food Menu", href: "/menu", desc: "Tandoori kebabs, rich butter chicken & fragrant biryanis" },
    { number: "04", label: "Drinks Menu", href: "/menu?category=Cocktails", desc: "Craft cocktails, single malts, wines & chilled beers" },
    { number: "05", label: "Gallery", href: "/#gallery", desc: "Photos and videos of our food, drinks & dining spaces" },
    { number: "06", label: "Events & DJ Nights", href: "/events", desc: "Weekend DJ nights, live acoustic music & party vibes" },
    { number: "07", label: "Private Dining", href: "/events#private-dining", desc: "Host birthdays, family celebrations & corporate dinners" },
    { number: "08", label: "Book a Table", href: "/reservations", desc: "Reserve your table in seconds with instant confirmation" },
    { number: "09", label: "Contact Us", href: "/#contact", desc: "Our address, phone number & daily opening hours" },
  ];

  return (
    <>
      {/* Table Session Active Notification Ribbon */}
      {isDineInActive && tableNumber && (
        <div className="bg-[#121826] border-b border-[#D4AF37]/30 text-[#FDFBF7] px-4 py-2 text-xs font-sans relative z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
              <span className="font-semibold tracking-wider text-[#D4AF37] uppercase text-[11px]">Table Session Active:</span>
              <span className="font-bold text-[#070B12] bg-[#D4AF37] px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                PUBLIQ • Table {tableNumber} {diningArea ? `• ${diningArea}` : ""}
              </span>
            </div>
            <button
              onClick={clearTableSession}
              className="text-[#D4AF37] hover:text-white text-xs underline cursor-pointer ml-3 font-medium transition-colors"
            >
              Exit Table
            </button>
          </div>
        </div>
      )}

      {/* Main Luxury Header */}
      <header 
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled 
            ? "bg-[#070B12]/95 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-2xl py-3" 
            : "bg-[#070B12]/80 backdrop-blur-sm border-b border-white/5 py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* LEFT: MENU Drawer Toggle Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDrawerOpen(true)}
                className="group flex items-center gap-3 text-[#FDFBF7] hover:text-[#D4AF37] transition-all px-3.5 py-2 rounded-full border border-white/10 hover:border-[#D4AF37]/50 bg-white/5 hover:bg-white/10"
                aria-label="Open Navigation Menu"
              >
                <div className="flex flex-col gap-1 w-5 justify-center items-start group-hover:items-center transition-all">
                  <span className="w-5 h-[1.5px] bg-[#D4AF37] transition-all group-hover:w-4" />
                  <span className="w-3.5 h-[1.5px] bg-[#FDFBF7] transition-all group-hover:w-5 group-hover:bg-[#D4AF37]" />
                  <span className="w-4 h-[1.5px] bg-[#D4AF37] transition-all group-hover:w-3" />
                </div>
                <span className="font-cinzel text-xs font-semibold tracking-[0.2em] text-[#FDFBF7] group-hover:text-[#D4AF37]">
                  MENU
                </span>
              </button>

              {/* Quick nav links for wide desktops */}
              <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-widest text-[#CBD5E1]">
                <a href="/menu" className="hover:text-[#D4AF37] transition-colors">Menu</a>
                <a href="/#story" className="hover:text-[#D4AF37] transition-colors">Story</a>
                <a href="/#gallery" className="hover:text-[#D4AF37] transition-colors">Gallery</a>
                <a href="/events" className="hover:text-[#D4AF37] transition-colors">Private Dining</a>
              </nav>
            </div>

            {/* CENTER: PUBLIQ Branding */}
            <div className="flex items-center">
              <a href="/" className="flex items-center group py-1">
                <img
                  src="/logo.png?v=4"
                  alt="PUBLIQ Bar & Restaurant"
                  className="h-10 sm:h-12 w-auto object-contain hover:scale-105 transition-all duration-300 drop-shadow-[0_0_15px_rgba(212,175,55,0.35)]"
                />
              </a>
            </div>

            {/* RIGHT: Actions (Order Online, Reserve Table, Cart) */}
            <div className="flex items-center gap-3 sm:gap-4">
              <a
                href="/menu"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-cinzel tracking-wider text-[#FDFBF7] hover:text-[#D4AF37] px-3 py-2 transition-colors"
              >
                ORDER ONLINE
              </a>

              <a
                href="/reservations"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-cinzel font-bold text-xs tracking-wider uppercase hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                RESERVE TABLE
              </a>

              {/* Shopping Bag Button */}
              <a
                href="/cart"
                className="relative p-2.5 rounded-full border border-white/10 hover:border-[#D4AF37]/50 bg-white/5 hover:bg-white/10 text-[#FDFBF7] hover:text-[#D4AF37] transition-colors"
                title="View Dining Cart"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4AF37] text-[#070B12] text-[10px] font-bold flex items-center justify-center font-sans shadow-md animate-pulse">
                    {itemCount}
                  </span>
                )}
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* FULL-SCREEN LUXURY EDITORIAL NAVIGATION DRAWER */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-[#070B12]/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn"
          style={{ animationDuration: "300ms" }}
        >
          {/* Top Bar inside Drawer */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-white/10">
            <a href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3">
              <img
                src="/logo.png?v=4"
                alt="PUBLIQ Bar & Restaurant"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]"
              />
            </a>

            <button
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#FDFBF7] hover:text-[#D4AF37] bg-white/5 transition-all cursor-pointer"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-cinzel text-xs tracking-widest">CLOSE</span>
            </button>
          </div>

          {/* Drawer Body: 9 Core Editorial Links + Hospitality Showcase */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
            
            {/* Left 7 Cols: The 9 Requested Navigation Items */}
            <div className="lg:col-span-7 flex flex-col space-y-4 sm:space-y-5">
              {drawerLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.number}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="group flex items-baseline gap-4 sm:gap-6 py-1 border-b border-white/5 hover:border-[#D4AF37]/40 transition-all"
                  >
                    <span className="font-cinzel text-xs sm:text-sm text-[#D4AF37]/60 group-hover:text-[#D4AF37] tracking-widest w-8">
                      {item.number}
                    </span>
                    <div className="flex flex-col">
                      <span className={`font-serif text-2xl sm:text-3xl font-semibold tracking-wide transition-all ${
                        isActive 
                          ? "text-[#D4AF37] translate-x-2" 
                          : "text-[#FDFBF7] group-hover:text-[#D4AF37] group-hover:translate-x-2"
                      }`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-[#CBD5E1] font-sans group-hover:text-[#E5C378] transition-colors mt-0.5 hidden sm:block">
                        {item.desc}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Right 5 Cols: Brand Story, Operating Hours, Quick CTAs */}
            <div className="lg:col-span-5 bg-[#0F1626]/80 p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/20 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[11px] font-cinzel uppercase tracking-[0.25em] text-[#D4AF37]">
                  The PUBLIQ Experience
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#FDFBF7] mt-1 mb-3">
                  Where Culinary Craft Meets High-Energy Mixology
                </h3>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  Immerse yourself in progressive gastronomy, artisanal clay oven specialties, and cocktail artistry in an evocative, candle-lit luxury ambience.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-start gap-3 text-[#EDE8DC]">
                  <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#FDFBF7]">Opening Hours</span>
                    <span className="text-[#CBD5E1]">Monday – Sunday: 12:00 PM – 01:00 AM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-[#EDE8DC]">
                  <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#FDFBF7]">Direct Reservations &amp; Owner</span>
                    <a href="tel:+919741744886" className="text-[#CBD5E1] hover:text-[#D4AF37] block font-mono">
                      +91 97417 44886
                    </a>
                    <a href="mailto:publiqbarresto@gmail.com" className="text-[11px] text-[#D4AF37] hover:underline block">
                      publiqbarresto@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-[#EDE8DC]">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#FDFBF7]">Location</span>
                    <a 
                      href="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#CBD5E1] hover:text-[#D4AF37] block"
                    >
                      QM73+544, Nosenuru Rd, Haragadde, Bengaluru
                    </a>
                  </div>
                </div>
              </div>

              {/* Direct Drawer CTAs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="/reservations"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] text-center font-cinzel font-bold text-xs tracking-wider uppercase hover:shadow-lg transition-all"
                >
                  Reserve Table
                </a>
                <a
                  href="/menu"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-3 rounded-xl border border-[#D4AF37]/50 text-[#FDFBF7] hover:bg-[#D4AF37]/10 text-center font-cinzel font-bold text-xs tracking-wider uppercase transition-all"
                >
                  Order Online
                </a>
              </div>

              {/* Administrative Portal Link */}
              <div className="pt-2 text-center border-t border-white/5">
                <a 
                  href="/admin" 
                  onClick={() => setDrawerOpen(false)}
                  className="text-[11px] text-[#CBD5E1] hover:text-[#D4AF37] font-mono tracking-wider inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Staff Operations Portal
                </a>
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#CBD5E1]">
            <span>© {new Date().getFullYear()} PUBLIQ Bar & Restaurant. All Rights Reserved.</span>
            <span className="text-[#D4AF37] font-cinzel tracking-widest text-[11px]">LUXURY GUEST CONCIERGE</span>
          </div>

        </div>
      )}
    </>
  );
};
