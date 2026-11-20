"use client";

import React, { useState, useEffect } from "react";
import { 
  Phone, Clock, MapPin, Mail, Instagram, ShieldCheck, 
  ArrowUpRight, Heart, Sparkles, UtensilsCrossed 
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-[#05080E] text-[#CBD5E1] pt-16 pb-12 border-t border-[#D4AF37]/20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png?v=4"
                alt="PUBLIQ Bar & Restaurant"
                className="h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.35)]"
              />
            </div>
            
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Where Culinary Craft Meets High-Energy Mixology. An immersive dining destination uniting progressive Indian gastronomy, charcoal tandoor craftsmanship, and bespoke cocktail alchemy.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F1626] border border-[#D4AF37]/40 text-[#FDFBF7] hover:text-[#D4AF37] hover:border-[#D4AF37] text-xs font-semibold transition-all shadow-sm group"
                title="Follow PUBLIQ on Instagram"
              >
                <Instagram className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span className="font-sans text-[11px] tracking-wider">@publiq.restaurant</span>
              </a>
            </div>
          </div>

          {/* Col 2: Flagship Destination */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold border-b border-[#D4AF37]/20 pb-2 inline-block">
              Flagship Destination
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-[#EDE8DC]">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span className="block font-medium">QM73+544, Nosenuru Rd, Haragadde</span>
                <span className="text-[#CBD5E1] text-[11px] block">Bengaluru, Karnataka 560105</span>
                <a 
                  href="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#D4AF37] hover:underline font-semibold mt-1"
                >
                  <span>Google Maps: QM73+544</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#EDE8DC]">
              <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <a href="tel:+919741744886" className="hover:text-[#D4AF37] transition-colors font-medium">
                +91 97417 44886 (Direct)
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#EDE8DC]">
              <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <a href="mailto:publiqbarresto@gmail.com" className="hover:text-[#D4AF37] transition-colors">
                publiqbarresto@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#EDE8DC]">
              <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>12:00 PM – 01:00 AM (Daily)</span>
            </div>
          </div>

          {/* Col 3: Sky Deck & Lounge */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold border-b border-[#D4AF37]/20 pb-2 inline-block">
              Sky Deck &amp; Lounge
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-[#EDE8DC]">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <span>Level 18 Grand Tower, Panoramic View</span>
                <a 
                  href="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-[11px] text-[#D4AF37] hover:underline font-semibold mt-0.5"
                >
                  Locate via Plus Code: QM73+544
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#EDE8DC]">
              <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <a href="tel:+919741744886" className="hover:text-[#D4AF37] transition-colors font-medium">
                +91 97417 44886 (VIP Lounge)
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#EDE8DC]">
              <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>04:00 PM – 01:00 AM (Evening Resto-Bar)</span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] pt-1">
              Complimentary VIP Valet Parking &amp; Private Lift Access.
            </p>
          </div>

          {/* Col 4: Quick Navigation & Portals */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold border-b border-[#D4AF37]/20 pb-2 inline-block">
              Explore &amp; Reserve
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/menu" className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
                  Food &amp; Drinks Menu
                </a>
              </li>
              <li>
                <a href="/reservations" className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5 font-medium text-[#FDFBF7]">
                  <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
                  Reserve a Table
                </a>
              </li>
              <li>
                <a href="/events" className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
                  Private Dining &amp; Events
                </a>
              </li>
              <li>
                <a href="/#gallery" className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
                  Photo &amp; Video Gallery
                </a>
              </li>
              <li className="pt-2 border-t border-white/10">
                <a 
                  href="/admin" 
                  className="text-[11px] text-[#D4AF37] hover:underline font-mono inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Enterprise Management Portal
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Ribbon */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#CBD5E1] gap-4">
          <p>
            © {new Date().getFullYear()} <strong className="text-[#FDFBF7]">PUBLIQ Bar &amp; Restaurant</strong>. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] font-cinzel tracking-wider text-[#D4AF37]">
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
