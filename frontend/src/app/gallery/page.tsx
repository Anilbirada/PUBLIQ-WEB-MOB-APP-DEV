"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, X, ChevronRight, Eye, Camera } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface GalleryItem {
  id: string;
  category: string;
  title: string;
  image_url: string;
  caption?: string;
}

const DEFAULT_GALLERY: GalleryItem[] = [
  { id: "g1", category: "INTERIOR", title: "Blossom Dining Hall", image_url: "/images/publiq/interior/publiq-interior-hero.webp", caption: "Illuminated floral ceiling and velvet private dining booths" },
  { id: "g2", category: "FOOD", title: "Charcoal Tandoori Kebab Platter", image_url: "/images/publiq/food/tandoori-mixed-grill.webp", caption: "Grilled over real live coals with house mint chutney" },
  { id: "g3", category: "COCKTAILS", title: "Artisan Smoked Bourbon Old Fashioned", image_url: "/images/publiq/drinks/craft-cocktails-mocktails.webp", caption: "Oak-smoked in bell jar with aromatic bitters & burnt orange zest" },
  { id: "g4", category: "BAR", title: "Reserve Single Malt Cellar", image_url: "/images/publiq/drinks/single-malt-reserve.webp", caption: "Curated collection of 12yo to 21yo Scotch, Irish & Japanese whiskies" },
  { id: "g5", category: "EVENTS", title: "Weekend DJ & High-Energy Nightlife", image_url: "/images/publiq/events/publiq-nightlife-party.webp", caption: "Live beats, ambient lighting, and crafted pitcher cocktails" },
  { id: "g6", category: "FOOD", title: "Signature Butter Chicken Copper Handi", image_url: "/images/publiq/food/butter-chicken-copper-handi.webp", caption: "Old Delhi 1947 slow-simmered tomato makhani with artisanal butter" },
  { id: "g7", category: "INTERIOR", title: "Garden Mezzanine & Alfresco Courtyard", image_url: "/images/publiq/interior/publiq-interior-dining.webp", caption: "Open-air dining under starry Haragadde night skies" },
  { id: "g8", category: "COCKTAILS", title: "Tropical Passionfruit Martini & Gin Fizz", image_url: "/images/publiq/drinks/beers-craft-bottles.webp", caption: "Botanical dry gins paired with artisanal sparkling tonics" }
];

export default function GalleryPage() {
  const [galleryFilter, setGalleryFilter] = useState<string>("ALL");
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  const filteredGallery = galleryFilter === "ALL"
    ? DEFAULT_GALLERY
    : DEFAULT_GALLERY.filter((g) => g.category.toUpperCase() === galleryFilter);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-widest uppercase shadow-xs">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Visual Showcase</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Photo &amp; Video Gallery
            </h1>
            
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Explore the luxurious ambience, clay tandoor culinary creations, bespoke mixology, and celebratory nightlife at PUBLIQ.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {["ALL", "INTERIOR", "FOOD", "COCKTAILS", "BAR", "EVENTS"].map((cat) => (
              <button
                key={cat}
                onClick={() => setGalleryFilter(cat)}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  galleryFilter === cat
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveLightboxImg(item.image_url)}
                className="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/40 shadow-lg">
                      <Eye className="w-5 h-5" />
                    </span>
                  </div>
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-900/70 text-amber-300 backdrop-blur-md border border-white/10">
                    {item.category}
                  </span>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  {item.caption && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation CTA */}
          <div className="text-center pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Lightbox Modal */}
      {activeLightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightboxImg(null)}
        >
          <button
            onClick={() => setActiveLightboxImg(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeLightboxImg}
              alt="PUBLIQ Gallery Preview"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
