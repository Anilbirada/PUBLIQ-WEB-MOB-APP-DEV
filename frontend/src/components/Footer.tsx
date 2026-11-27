"use client";

import React from "react";
import { 
  Phone, Clock, MapPin, Mail, Instagram, ShieldCheck, 
  ArrowUpRight, Heart, Sparkles, UtensilsCrossed 
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-white text-slate-700 pt-16 pb-12 border-t border-slate-200/90 relative z-10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png?v=7"
                alt="PUBLIQ Bar & Restaurant"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)]"
              />
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Where Culinary Craft Meets High-Energy Mixology. An immersive dining destination uniting progressive Indian gastronomy, charcoal tandoor craftsmanship, and bespoke cocktail alchemy.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50/50 text-xs font-semibold transition-all shadow-xs group"
                title="Follow PUBLIQ on Instagram"
              >
                <Instagram className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
                <span className="font-sans text-[11px] tracking-wider font-semibold">@publiq.restaurant</span>
              </a>
            </div>
          </div>

          {/* Col 2: Venue Location */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.2em] text-slate-900 font-bold border-b border-amber-300/80 pb-2 inline-block">
              Venue Location
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="block font-semibold text-slate-900">QM73+544, Nosenuru Rd, Haragadde</span>
                <span className="text-slate-600 text-[11px] block">Bengaluru, Karnataka 560105</span>
                <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">Plus Code: QM73+544</span>
              </div>
            </div>
            <div className="pt-1">
              <a 
                href="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:border-amber-400 hover:bg-amber-100/70 text-xs font-semibold transition-all shadow-xs"
              >
                <span>View on Google Maps</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 font-medium">
              Garden Dining, Open-Air Cabanas &amp; Craft Cocktail Bar.
            </p>
          </div>

          {/* Col 3: Direct Contact & Hours */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.2em] text-slate-900 font-bold border-b border-amber-300/80 pb-2 inline-block">
              Direct Contact &amp; Hours
            </h4>
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Owner &amp; Reservations</span>
                <a href="tel:+919741744886" className="hover:text-blue-600 transition-colors font-bold text-sm text-slate-900">
                  +91 97417 44886
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Official Email</span>
                <a href="mailto:publiqbarresto@gmail.com" className="hover:text-indigo-600 transition-colors font-medium text-slate-800">
                  publiqbarresto@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Opening Hours</span>
                <span className="font-semibold text-slate-900">12:00 PM – 01:00 AM (Daily)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 font-medium">
              Complimentary Valet Parking Available.
            </p>
          </div>

          {/* Col 4: Quick Navigation & Portals */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.2em] text-slate-900 font-bold border-b border-amber-300/80 pb-2 inline-block">
              Explore &amp; Reserve
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/menu" className="text-slate-600 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-blue-500" />
                  Food &amp; Drinks Menu
                </a>
              </li>
              <li>
                <a href="/reservations" className="text-slate-800 hover:text-amber-600 font-semibold transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-amber-500" />
                  Reserve a Table
                </a>
              </li>
              <li>
                <a href="/events" className="text-slate-600 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-blue-500" />
                  Private Dining &amp; Events
                </a>
              </li>
              <li>
                <a href="/gallery" className="text-slate-600 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-blue-500" />
                  Photo &amp; Video Gallery
                </a>
              </li>
              <li className="pt-2 border-t border-slate-200">
                <a 
                  href="/login" 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-xs hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Enterprise Portal Login
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Ribbon */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-800 font-bold">PUBLIQ Bar &amp; Restaurant</strong>. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] font-cinzel tracking-wider text-amber-700 font-semibold">
            <span>FINE DINING</span>
            <span>•</span>
            <span>RESTO-BAR</span>
            <span>•</span>
            <span>PRIVATE EVENTS</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
