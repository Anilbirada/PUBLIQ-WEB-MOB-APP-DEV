"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  ShoppingBag, Menu as MenuIcon, X, Calendar, UtensilsCrossed, 
  Wine, Sparkles, MapPin, Phone, Clock, ArrowRight, ShieldCheck,
  LogIn, UserCheck
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

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
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
    { number: "10", label: "My Orders & History", href: "/account", desc: "View your current active table order & order history" },
    { number: "11", label: "Staff & Role Login", href: "/login", desc: "Super Admin, Bar Admin, Kitchen Admin, Waiter & Guest Portals" },
  ];

  return (
    <>
      {/* Table Session Active Notification Ribbon (Crisp White/Amber) */}
      {isDineInActive && tableNumber && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs font-sans relative z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
              <span className="font-bold tracking-wider text-amber-800 uppercase text-[11px]">Table Session Active:</span>
              <span className="font-extrabold text-white bg-gradient-to-r from-amber-600 to-orange-600 px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider shadow-xs">
                PUBLIQ • Table {tableNumber} {diningArea ? `• ${diningArea}` : ""}
              </span>
            </div>
            <button
              onClick={clearTableSession}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold underline cursor-pointer ml-3 transition-colors"
            >
              Exit Table
            </button>
          </div>
        </div>
      )}

      {/* Main Luxury Header (Pure White Background with Soft Shadow) */}
      <header 
        className={`sticky top-0 z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-200/90 ${
          scrolled ? "shadow-sm py-2.5" : "py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* LEFT: MENU Drawer Toggle Button & Desktop Links */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDrawerOpen(true)}
                className="group flex items-center gap-2.5 text-slate-800 hover:text-blue-700 transition-all px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 shadow-xs"
                aria-label="Open Navigation Menu"
              >
                <div className="flex flex-col gap-1 w-4 justify-center items-start group-hover:items-center transition-all">
                  <span className="w-4 h-[2px] bg-blue-600 transition-all group-hover:w-3" />
                  <span className="w-3 h-[2px] bg-slate-800 transition-all group-hover:w-4 group-hover:bg-blue-600" />
                  <span className="w-3.5 h-[2px] bg-blue-600 transition-all group-hover:w-2" />
                </div>
                <span className="font-bold text-xs tracking-wider text-slate-800 group-hover:text-blue-700">
                  MENU
                </span>
              </button>

              {/* Quick nav links for wide desktops */}
              <nav className="hidden lg:flex items-center gap-6 text-xs uppercase font-bold tracking-wider text-slate-600">
                <a href="/menu" className="hover:text-blue-700 transition-colors">Menu</a>
                <a href="/#story" className="hover:text-blue-700 transition-colors">Story</a>
                <a href="/#gallery" className="hover:text-blue-700 transition-colors">Gallery</a>
                <a href="/events" className="hover:text-blue-700 transition-colors">Private Dining</a>
              </nav>
            </div>

            {/* CENTER: PUBLIQ Branding */}
            <div className="flex items-center">
              <a href="/" className="flex items-center group py-0.5">
                <img
                  src="/logo.png?v=4"
                  alt="PUBLIQ Bar & Restaurant"
                  className="h-10 sm:h-12 w-auto object-contain hover:scale-105 transition-all duration-300"
                />
              </a>
            </div>

            {/* RIGHT: Actions (Order Online, Reserve Table, Portal Login, Cart) */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <a
                href="/menu"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 hover:text-blue-700 px-3 py-2 transition-colors uppercase"
              >
                ORDER ONLINE
              </a>

              <a
                href="/account"
                className="hidden md:inline-flex items-center gap-1 text-xs font-bold tracking-wider text-slate-700 hover:text-blue-700 px-2.5 py-2 transition-colors uppercase"
                title="Customer Order History"
              >
                MY ORDERS
              </a>

              <a
                href="/reservations"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs tracking-wider uppercase hover:shadow-md transition-all shadow-xs"
              >
                RESERVE TABLE
              </a>

              {/* Portal & Role Login Button */}
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs tracking-wider uppercase hover:shadow-md transition-all shadow-xs"
                title="Employee & Role Login"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PORTAL LOGIN</span>
              </a>

              {/* Shopping Bag Button */}
              <a
                href="/cart"
                className="relative p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-700 transition-colors shadow-xs"
                title="View Dining Cart"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center font-sans shadow-xs animate-pulse">
                    {itemCount}
                  </span>
                )}
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* FULL-SCREEN NAVIGATION DRAWER (PURE WHITE BACKGROUND) */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-white/98 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn text-slate-900"
          style={{ animationDuration: "250ms" }}
        >
          {/* Top Bar inside Drawer */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-200 bg-white">
            <a href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3">
              <img
                src="/logo.png?v=4"
                alt="PUBLIQ Bar & Restaurant"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </a>

            <button
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-slate-50 transition-all cursor-pointer shadow-xs"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5 text-slate-700" />
              <span className="font-bold text-xs tracking-wider">CLOSE</span>
            </button>
          </div>

          {/* Drawer Body: Core Editorial Links + Hospitality Showcase */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center flex-1">
            
            {/* Left 7 Cols: Requested Navigation Items */}
            <div className="lg:col-span-7 flex flex-col space-y-3 sm:space-y-4">
              {drawerLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.number}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="group flex items-baseline gap-4 sm:gap-6 py-1.5 border-b border-slate-100 hover:border-blue-200 transition-all"
                  >
                    <span className="text-xs sm:text-sm text-blue-600 font-extrabold tracking-widest w-8 font-mono">
                      {item.number}
                    </span>
                    <div className="flex flex-col">
                      <span className={`font-serif text-xl sm:text-2xl font-bold tracking-tight transition-all ${
                        isActive 
                          ? "text-blue-700 translate-x-2" 
                          : "text-slate-900 group-hover:text-blue-700 group-hover:translate-x-2"
                      }`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-500 font-sans group-hover:text-slate-700 transition-colors mt-0.5 hidden sm:block">
                        {item.desc}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Right 5 Cols: Brand Story, Operating Hours, Quick CTAs */}
            <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6 shadow-xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
                  The PUBLIQ Experience
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-1 mb-2">
                  Where Culinary Craft Meets High-Energy Mixology
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Immerse yourself in progressive gastronomy, artisanal clay oven specialties, and cocktail artistry in a bright, modern, and inviting ambiance.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-start gap-3 text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Opening Hours</span>
                    <span className="text-slate-600">Monday – Sunday: 12:00 PM – 01:00 AM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Direct Reservations & Concierge</span>
                    <a href="tel:+919741744886" className="text-slate-700 hover:text-blue-700 block font-mono font-semibold">
                      +91 97417 44886
                    </a>
                    <a href="mailto:publiqbarresto@gmail.com" className="text-[11px] text-blue-700 hover:underline block font-medium">
                      publiqbarresto@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Location</span>
                    <a 
                      href="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-blue-700 block"
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
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center font-bold text-xs tracking-wider uppercase hover:shadow-md transition-all shadow-xs"
                >
                  Reserve Table
                </a>
                <a
                  href="/menu"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-center font-bold text-xs tracking-wider uppercase transition-all shadow-xs"
                >
                  Order Online
                </a>
              </div>

              {/* Administrative Portal Link */}
              <div className="pt-2 text-center border-t border-slate-200 space-y-2">
                <a 
                  href="/login" 
                  onClick={() => setDrawerOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  Staff & Role-Based Login Portal
                </a>
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-white">
            <span>© {new Date().getFullYear()} PUBLIQ Bar & Restaurant. All Rights Reserved.</span>
            <span className="text-blue-700 font-bold tracking-wider text-[11px]">HOSPITALITY & GASTRONOMY</span>
          </div>

        </div>
      )}
    </>
  );
};
