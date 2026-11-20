"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Image as ImageIcon, MessageSquare, Edit3, Save, 
  Plus, Check, Eye, Trash2, ArrowUpRight, Film, Star, Layers
} from "lucide-react";

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<"SECTIONS" | "GALLERY" | "TESTIMONIALS">("SECTIONS");
  const [sections, setSections] = useState<any>({});
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Editing CMS Section state
  const [selectedSectionKey, setSelectedSectionKey] = useState("hero");
  const [currentSectionData, setCurrentSectionData] = useState<any>({});

  // New Gallery Item state
  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryCategory, setNewGalleryCategory] = useState("INTERIOR");
  const [newGalleryUrl, setNewGalleryUrl] = useState("/images/publiq/interior/publiq-interior-hero.webp");
  const [newGalleryCaption, setNewGalleryCaption] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

  useEffect(() => {
    fetchCmsData();
  }, []);

  const fetchCmsData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch CMS sections
      const secRes = await fetch(`${API_BASE}/experience/cms/sections`);
      if (secRes.ok) {
        const secData = await secRes.json();
        setSections(secData);
        if (secData[selectedSectionKey]) {
          setCurrentSectionData(secData[selectedSectionKey]);
        }
      }

      // 2. Fetch Gallery items
      const galRes = await fetch(`${API_BASE}/experience/gallery`);
      if (galRes.ok) {
        const galData = await galRes.json();
        setGalleryItems(galData);
      }

      // 3. Fetch Testimonials
      const testRes = await fetch(`${API_BASE}/experience/testimonials`);
      if (testRes.ok) {
        const testData = await testRes.json();
        setTestimonials(testData);
      }
    } catch (e) {
      console.error("Failed to load CMS data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSection = (key: string) => {
    setSelectedSectionKey(key);
    setCurrentSectionData(sections[key] || {});
  };

  const handleSaveSection = async () => {
    try {
      const res = await fetch(`${API_BASE}/experience/cms/section/${selectedSectionKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentSectionData),
      });
      if (res.ok) {
        setSections((prev: any) => ({
          ...prev,
          [selectedSectionKey]: currentSectionData,
        }));
        setSaveStatus(`Saved "${selectedSectionKey.toUpperCase()}" section successfully!`);
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      setSaveStatus("Failed to save changes.");
    }
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/experience/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newGalleryTitle,
          category: newGalleryCategory,
          image_url: newGalleryUrl,
          caption: newGalleryCaption,
          display_order: galleryItems.length + 1,
        }),
      });
      if (res.ok) {
        setIsAddingGallery(false);
        setNewGalleryTitle("");
        setNewGalleryCaption("");
        fetchCmsData();
      }
    } catch (_) {}
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D4AF37]/20">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-[#D4AF37]">
            <Layers className="w-4 h-4" />
            <span>Digital Content Experience</span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-white mt-1">
            Website CMS & Media Asset Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centrally manage homepage copy, gallery photography, guest reviews, and promotional announcements.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0A111F] border border-[#D4AF37]/30 shadow-md">
          <button
            onClick={() => setActiveTab("SECTIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "SECTIONS"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Page Sections
          </button>
          <button
            onClick={() => setActiveTab("GALLERY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "GALLERY"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Gallery ({galleryItems.length})
          </button>
          <button
            onClick={() => setActiveTab("TESTIMONIALS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "TESTIMONIALS"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Testimonials ({testimonials.length})
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* 1. SECTIONS TAB */}
      {activeTab === "SECTIONS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section Picker */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37] block mb-3">
              Editable Homepage Sections
            </span>
            {[
              { key: "hero", label: "Hero Banner", desc: "Headline, badge, video background" },
              { key: "story", label: "Our Story & Heritage", desc: "Culinary narrative, chef vision" },
              { key: "atmosphere", label: "Atmosphere & Dining", desc: "Zoning, cabanas, sensory dining" },
              { key: "contact_info", label: "Contact & Concierge", desc: "Phone, address, opening timings" },
            ].map((sec) => (
              <button
                key={sec.key}
                onClick={() => handleSelectSection(sec.key)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedSectionKey === sec.key
                    ? "bg-[#0A111F] border-[#D4AF37] shadow-xl ring-1 ring-[#D4AF37]"
                    : "bg-[#0A111F]/50 border-[#D4AF37]/15 text-slate-400 hover:border-[#D4AF37]/40 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-white">{sec.label}</span>
                  {selectedSectionKey === sec.key && (
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{sec.desc}</p>
              </button>
            ))}
          </div>

          {/* Section Form Editor */}
          <div className="lg:col-span-8 bg-[#0A111F] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/25 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Live Editor</span>
                <h3 className="font-serif text-xl font-normal text-white capitalize">
                  Editing {selectedSectionKey.replace("_", " ")} Section
                </h3>
              </div>
              <button
                onClick={handleSaveSection}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] hover:opacity-95 text-[#070B12] font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {Object.keys(currentSectionData).length === 0 ? (
                <p className="text-slate-400">Loading section details...</p>
              ) : (
                Object.entries(currentSectionData).map(([field, val]) => (
                  <div key={field}>
                    <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      {field.replace(/_/g, " ")}
                    </label>
                    {typeof val === "string" && val.length > 80 ? (
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) =>
                          setCurrentSectionData({ ...currentSectionData, [field]: e.target.value })
                        }
                        className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) =>
                          setCurrentSectionData({ ...currentSectionData, [field]: e.target.value })
                        }
                        className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. GALLERY TAB */}
      {activeTab === "GALLERY" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {galleryItems.length} curated photographs across Interior, Exterior, Food, Drinks & Events.
            </span>
            <button
              onClick={() => setIsAddingGallery(!isAddingGallery)}
              className="py-2.5 px-5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Image</span>
            </button>
          </div>

          {/* Add Gallery Item Form */}
          {isAddingGallery && (
            <form onSubmit={handleAddGalleryItem} className="p-6 rounded-3xl bg-[#0A111F] border border-[#D4AF37]/30 space-y-4 text-xs shadow-xl animate-fade-in">
              <h3 className="font-serif text-lg font-normal text-white">Add New Gallery Photograph</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={newGalleryTitle}
                    onChange={(e) => setNewGalleryTitle(e.target.value)}
                    placeholder="e.g. Master Cocktail Bar"
                    className="w-full p-2.5 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category *</label>
                  <select
                    value={newGalleryCategory}
                    onChange={(e) => setNewGalleryCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="INTERIOR">INTERIOR</option>
                    <option value="EXTERIOR">EXTERIOR</option>
                    <option value="FOOD">FOOD</option>
                    <option value="DRINKS">DRINKS</option>
                    <option value="EVENTS">EVENTS</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Image WebP URL *</label>
                  <input
                    type="text"
                    required
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Caption / Story Note</label>
                <input
                  type="text"
                  value={newGalleryCaption}
                  onChange={(e) => setNewGalleryCaption(e.target.value)}
                  placeholder="e.g. Handcrafted smoke cocktail in midnight ambiance..."
                  className="w-full p-2.5 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGallery(false)}
                  className="px-4 py-2 rounded-xl bg-[#070B12] text-slate-300 border border-[#D4AF37]/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] font-bold"
                >
                  Save Image
                </button>
              </div>
            </form>
          )}

          {/* Gallery Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#0A111F] rounded-2xl overflow-hidden border border-[#D4AF37]/20 shadow-xl group hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#070B12]">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/images/publiq/interior/publiq-interior-hero.webp";
                    }}
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#070B12]/85 text-[#D4AF37] border border-[#D4AF37]/30 backdrop-blur-sm shadow">
                    {item.category}
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-serif text-sm font-normal text-white">{item.title}</h4>
                  {item.caption && <p className="text-[11px] text-slate-400 line-clamp-1">{item.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TESTIMONIALS TAB */}
      {activeTab === "TESTIMONIALS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-[#0A111F] rounded-3xl p-6 border border-[#D4AF37]/20 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      {t.occasion}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white">{t.guest_name}</h4>
                    <p className="text-[10px] text-slate-400">{t.guest_title}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                    VERIFIED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
