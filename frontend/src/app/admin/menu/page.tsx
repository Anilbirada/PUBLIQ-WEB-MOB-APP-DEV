"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UtensilsCrossed, PlusCircle, Search, Filter, 
  Check, X, AlertTriangle, EyeOff, Sparkles, Clock, FileSpreadsheet,
  Image as ImageIcon, Upload, Save, RefreshCw, CheckCircle2, AlertCircle
} from "lucide-react";
import { getMenuItemImage } from "../../../lib/menuImages";

interface MenuItemAdmin {
  id: string;
  name: string;
  category: string;
  type: "FOOD" | "BEVERAGE";
  price: number;
  is_veg: boolean;
  is_available: boolean;
  prep_time_minutes: number;
  description: string;
  image_url?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://publiq-backend.onrender.com/api/v1";

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItemAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "FOOD" | "BEVERAGE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [missingOnlyFilter, setMissingOnlyFilter] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Image replacement modal state
  const [editingItem, setEditingItem] = useState<MenuItemAdmin | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/menu`);
      if (res.ok) {
        const categories = await res.json();
        const flattened: MenuItemAdmin[] = [];
        categories.forEach((cat: any) => {
          (cat.items || []).forEach((it: any) => {
            flattened.push({
              id: it.id,
              name: it.name,
              category: cat.name || "General",
              type: it.is_alcohol ? "BEVERAGE" : "FOOD",
              price: it.base_price || 0,
              is_veg: Boolean(it.is_veg),
              is_available: it.is_available ?? true,
              prep_time_minutes: it.preparation_time_minutes || 15,
              description: it.description || "",
              image_url: it.image_url || getMenuItemImage(it, cat.name, cat.slug)
            });
          });
        });
        setMenuItems(flattened);
      }
    } catch (e) {
      console.warn("Failed to load live menu:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const toggleAvailability = (id: string) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.is_available;
        setToastMsg(`${item.name} is now ${nextState ? "ACTIVE on menus" : "86'd / OUT OF STOCK"}`);
        setToastType("success");
        setTimeout(() => setToastMsg(""), 3500);
        return { ...item, is_available: nextState };
      }
      return item;
    }));
  };

  const openImageEditor = (item: MenuItemAdmin) => {
    setEditingItem(item);
    setNewImageUrl(item.image_url || "");
    setPreviewUrl(item.image_url || "");
  };

  const closeImageEditor = () => {
    setEditingItem(null);
    setNewImageUrl("");
    setPreviewUrl("");
  };

  const handleSaveImage = async () => {
    if (!editingItem || !newImageUrl.trim()) return;
    setIsSavingImage(true);
    try {
      const res = await fetch(`${API_BASE}/menu/items/${editingItem.id}/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: newImageUrl.trim() })
      });
      if (res.ok) {
        setMenuItems(prev => prev.map(it => it.id === editingItem.id ? { ...it, image_url: newImageUrl.trim() } : it));
        setToastMsg(`Successfully updated photo for ${editingItem.name}!`);
        setToastType("success");
        closeImageEditor();
      } else {
        const err = await res.json();
        setToastMsg(err.detail || "Failed to update image.");
        setToastType("error");
      }
    } catch (e) {
      // Local optimistic update if backend is offline
      setMenuItems(prev => prev.map(it => it.id === editingItem.id ? { ...it, image_url: newImageUrl.trim() } : it));
      setToastMsg(`Updated local image mapping for ${editingItem.name}.`);
      setToastType("success");
      closeImageEditor();
    } finally {
      setIsSavingImage(false);
      setTimeout(() => setToastMsg(""), 3500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/menu/upload-image`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setNewImageUrl(data.image_url);
        setPreviewUrl(data.image_url);
      } else {
        alert("Image upload failed. Ensure the image is .webp, .jpg, or .png.");
      }
    } catch (err) {
      alert("Upload failed. Using file locally.");
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filtered = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || item.type === typeFilter;
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesMissing = !missingOnlyFilter || !item.image_url || item.image_url.includes("placeholder") || item.image_url.includes("black");
    return matchesSearch && matchesType && matchesCategory && matchesMissing;
  });

  const totalFood = menuItems.filter(i => i.type === "FOOD").length;
  const totalBev = menuItems.filter(i => i.type === "BEVERAGE").length;
  const eightysixed = menuItems.filter(i => !i.is_available).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-[#38BDF8] font-bold flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-[#38BDF8]" /> Centralized Menu &amp; Product Image Manager
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Menu Catalog &amp; Image Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Audit product photography, replace dish/drink images, upload custom assets, and monitor 86&#39;d availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMenuItems}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </button>
          <Link
            href="/admin/menu/import"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#070B12]" />
            <span>+ Import Excel / CSV</span>
          </Link>
        </div>
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xl ${
          toastType === "success" 
            ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-200" 
            : "bg-rose-950/80 border border-rose-500/50 text-rose-200"
        }`}>
          {toastType === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/20 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Menu Items</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{menuItems.length}</span>
            <span className="text-xs font-semibold text-[#38BDF8] bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#38BDF8]/30">Active Catalog</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/20 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kitchen Dishes</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{totalFood}</span>
            <span className="text-xs font-semibold text-[#38BDF8] bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#38BDF8]/30">KOT Routed</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/20 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bar Offerings</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{totalBev}</span>
            <span className="text-xs font-semibold text-[#D4AF37] bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#D4AF37]/30">Bar Dispense</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/20 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">86&#39;d / Out of Stock</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-rose-400">{eightysixed}</span>
            <span className="text-xs font-semibold bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/40">Hidden from Guests</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-[#0B1528]/80 border border-[#38BDF8]/20 rounded-3xl p-5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search dish, cocktail, or ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070E1A] border border-[#38BDF8]/30 text-white placeholder-slate-400 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <div className="flex bg-[#070E1A] p-1 rounded-2xl border border-[#38BDF8]/25 shrink-0">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${typeFilter === "ALL" ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("FOOD")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${typeFilter === "FOOD" ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              Food
            </button>
            <button
              onClick={() => setTypeFilter("BEVERAGE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${typeFilter === "BEVERAGE" ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              Bar
            </button>
          </div>

          <button
            onClick={() => setMissingOnlyFilter(!missingOnlyFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
              missingOnlyFilter
                ? "bg-rose-500 text-white border-rose-400 shadow-md"
                : "bg-[#070E1A] text-slate-300 hover:text-white border-[#38BDF8]/20"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Missing Images</span>
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.slice(0, 10).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === cat 
                    ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] shadow-sm" 
                    : "bg-[#070E1A] text-slate-300 hover:text-white border border-[#38BDF8]/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Menu Items Table */}
      <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070E1A] text-[#38BDF8] uppercase tracking-wider border-b border-[#38BDF8]/20">
              <tr>
                <th className="py-3.5 px-4 font-bold text-center">Photo</th>
                <th className="py-3.5 px-4 font-bold">Item Details</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold text-center">Type</th>
                <th className="py-3.5 px-4 font-bold text-center">Dietary</th>
                <th className="py-3.5 px-4 font-bold text-right">Price</th>
                <th className="py-3.5 px-4 font-bold text-center">Image Action</th>
                <th className="py-3.5 px-4 font-bold text-right">86&#39;d Switch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#38BDF8]/15">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-[#0E1D35]/60 transition-colors">
                  {/* Photo Thumbnail */}
                  <td className="py-3 px-4 text-center">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 mx-auto relative group shadow-sm">
                      <img 
                        src={item.image_url || "/images/publiq/food/butter-chicken-copper-handi.webp"} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = item.type === "FOOD"
                            ? "/images/publiq/products/butter-chicken-copper-bowl.webp"
                            : "/images/publiq/products/cocktails-tropical-trio.webp";
                        }}
                      />
                    </div>
                  </td>

                  {/* Name & Description */}
                  <td className="py-4 px-4 max-w-xs">
                    <div className="font-serif font-bold text-white text-sm">{item.name}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#070E1A] border border-[#38BDF8]/20 text-[#38BDF8] text-xs font-semibold">
                      {item.category}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.type === "FOOD" 
                        ? "bg-amber-950/80 text-amber-300 border border-amber-500/40" 
                        : "bg-blue-950/80 text-sky-300 border border-sky-500/40"
                    }`}>
                      {item.type}
                    </span>
                  </td>

                  {/* Dietary */}
                  <td className="py-4 px-4 text-center">
                    {item.is_veg ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> VEG
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> NON-VEG
                      </span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 text-right font-serif font-bold text-white text-base">
                    ₹{item.price.toFixed(2)}
                  </td>

                  {/* Image Replacement Action */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => openImageEditor(item)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Change Photo</span>
                    </button>
                  </td>

                  {/* 86'd Toggle */}
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        item.is_available 
                          ? "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40" 
                          : "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {item.is_available ? "86 This Dish" : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Image Editor Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border border-[#38BDF8]/40 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#38BDF8]" />
                  Product Image Editor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Updating: <span className="font-semibold text-white">{editingItem.name}</span>
                </p>
              </div>
              <button 
                onClick={closeImageEditor}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Live Preview
              </label>
              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 relative flex items-center justify-center">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/publiq/products/butter-chicken-copper-bowl.webp";
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-500">No image specified</span>
                )}
              </div>
            </div>

            {/* Image URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Image Path or URL
              </label>
              <input 
                type="text"
                value={newImageUrl}
                onChange={(e) => {
                  setNewImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="/images/publiq/products/..."
                className="w-full bg-[#070E1A] border border-[#38BDF8]/30 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* File Upload Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Or Upload File (.webp, .jpg, .png)
              </label>
              <input 
                type="file"
                accept="image/webp,image/jpeg,image/png"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
              />
              {isUploading && <span className="text-[11px] text-blue-400 block">Uploading image...</span>}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={closeImageEditor}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={isSavingImage || !newImageUrl.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
              >
                {isSavingImage ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
