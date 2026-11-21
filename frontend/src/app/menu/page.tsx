"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Filter, Sparkles, Flame, Clock, Wine, 
  UtensilsCrossed, AlertCircle, ShoppingBag, Plus, Check,
  Leaf, Coffee, GlassWater, Beer, ArrowRight
} from "lucide-react";
import { api } from "../../lib/api";
import { useTableSession } from "../../context/TableSessionContext";
import { useCart } from "../../context/CartContext";
import { ProductDetailModal } from "../../components/ProductDetailModal";

export default function MenuPage() {
  const { tableNumber, diningArea, isDineInActive, outletName } = useTableSession();
  const { addItem, itemCount } = useCart();

  // Menu Mode: Food vs Drinks
  const [activeMenuTab, setActiveMenuTab] = useState<"FOOD" | "DRINKS">("FOOD");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadMenu() {
      setIsLoading(true);
      try {
        const data = await api.getMenu({
          veg_only: vegOnly || undefined,
          search: searchQuery || undefined,
        });
        setCategories(data);
      } catch (err) {
        console.error("Failed to load menu", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, [vegOnly, searchQuery]);

  // Handle Quick Add to Cart
  const handleQuickAdd = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addItem({
        item_id: item.id,
        quantity: 1,
      });
      setAddedNotice(`Added "${item.name}" to order`);
      setTimeout(() => setAddedNotice(null), 2500);
    } catch (_) {}
  };

  // Filter categories strictly based on activeMenuTab (Food vs Drinks)
  const isAlcoholOrDrink = (cat: any) => {
    return (
      cat.is_alcohol ||
      cat.slug === "cocktails" ||
      cat.slug === "spirits" ||
      cat.slug === "beverages" ||
      cat.slug === "mocktails" ||
      cat.slug === "whisky" ||
      cat.slug === "vodka" ||
      cat.slug === "gin" ||
      cat.slug === "beer" ||
      cat.slug === "wine" ||
      cat.slug === "rum" ||
      cat.slug === "classic-cocktails" ||
      cat.slug === "signature-cocktails" ||
      cat.slug === "soft-drinks"
    );
  };

  const filteredCategories = categories
    .filter((cat) => {
      if (activeMenuTab === "FOOD" && isAlcoholOrDrink(cat)) return false;
      if (activeMenuTab === "DRINKS" && !isAlcoholOrDrink(cat)) return false;
      if (selectedCategorySlug !== "all" && cat.slug !== selectedCategorySlug) return false;
      // Only show categories that have items with valid images
      const validItems = cat.items?.filter((item: any) => item.image_url && item.image_url.trim() !== "");
      return validItems && validItems.length > 0;
    })
    .map((cat) => ({
      ...cat,
      items: cat.items?.filter((item: any) => item.image_url && item.image_url.trim() !== "")
    }));

  // Extract subcategories for current tab (only those with available items)
  const availableSubcategories = categories.filter((cat) => {
    const isDrink = isAlcoholOrDrink(cat);
    if (activeMenuTab === "FOOD" && isDrink) return false;
    if (activeMenuTab === "DRINKS" && !isDrink) return false;
    const validItems = cat.items?.filter((item: any) => item.image_url && item.image_url.trim() !== "");
    return validItems && validItems.length > 0;
  });

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-[#070B12] bg-cover bg-fixed" style={{ backgroundImage: "linear-gradient(to bottom, rgba(7,11,18,0.97), rgba(7,11,18,0.95)), url('/images/publiq/backgrounds/bg-menu.webp')" }}>
      {/* Table Context Sticky Banner if Dine-In */}
      {isDineInActive && tableNumber && (
        <div className="bg-[#0A111F] border-b border-[#D4AF37]/30 text-white px-4 py-2.5 sticky top-20 z-40 shadow-xl backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#996515] flex items-center justify-center font-bold text-[#070B12] text-xs shadow-md">
                {tableNumber}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                  PUBLIQ — TABLE {tableNumber}
                </div>
                <div className="text-[11px] text-slate-400">
                  {diningArea || "Grand Dining Hall"} • {outletName || "PUBLIQ HARAGADDE"}
                </div>
              </div>
            </div>
            <a
              href="/cart"
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C378] text-[#070B12] px-4 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Summary ({itemCount})</span>
            </a>
          </div>
        </div>
      )}

      {/* Added to cart toast notification */}
      {addedNotice && (
        <div className="fixed top-24 right-6 z-50 bg-[#0F1626] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#D4AF37] text-xs flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-[#D4AF37]" />
          <span className="font-medium tracking-wide">{addedNotice}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative py-16 sm:py-20 border-b border-[#D4AF37]/15 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,17,31,0.92), rgba(7,11,18,0.96)), url('/images/publiq/backgrounds/bg-menu.webp')" }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F1626] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            PUBLIQ Culinary & Cellar Collection
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-white">
            The Digital <span className="italic text-[#D4AF37]">Menu</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Select between our signature artisanal gastronomy crafted over authentic charcoal tandoor ovens, or discover masterclass mixology and rare reserve spirits.
          </p>

          {/* DUAL MENU SWITCHER: FOOD VS DRINKS */}
          <div className="pt-6 flex justify-center">
            <div className="inline-flex p-1.5 rounded-full bg-[#0A111F] border border-[#D4AF37]/30 shadow-2xl">
              <button
                onClick={() => {
                  setActiveMenuTab("FOOD");
                  setSelectedCategorySlug("all");
                }}
                className={`flex items-center gap-2.5 px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                  activeMenuTab === "FOOD"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Culinary Food Menu</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuTab("DRINKS");
                  setSelectedCategorySlug("all");
                }}
                className={`flex items-center gap-2.5 px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                  activeMenuTab === "DRINKS"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Wine className="w-4 h-4" />
                <span>Artisan Bar & Cocktails</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A111F] p-4 rounded-3xl border border-[#D4AF37]/20 shadow-xl">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder={activeMenuTab === "FOOD" ? "Search kebabs, curries, breads, biryanis..." : "Search single malts, cocktails, gins, wines..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#070B12] border border-[#D4AF37]/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
          </div>

          {/* Secondary Filters */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Vegetarian Toggle (Relevant for food) */}
            {activeMenuTab === "FOOD" && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                />
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800/50">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  Pure Vegetarian Only
                </span>
              </label>
            )}

            <a
              href="/cart"
              className="relative p-2.5 rounded-full bg-[#0F1626] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#070B12] border border-[#D4AF37]/30 transition-all shadow-md"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#996515] text-[#070B12] text-[10px] font-bold flex items-center justify-center shadow">
                  {itemCount}
                </span>
              )}
            </a>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategorySlug("all")}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider whitespace-nowrap transition-all uppercase ${
              selectedCategorySlug === "all"
                ? "bg-[#D4AF37] text-[#070B12] font-bold shadow-md shadow-[#D4AF37]/20"
                : "bg-[#0A111F] border border-[#D4AF37]/20 text-slate-200 hover:text-white hover:border-[#D4AF37]/50"
            }`}
          >
            All {activeMenuTab === "FOOD" ? "Dishes" : "Beverages"}
          </button>
          {availableSubcategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider whitespace-nowrap transition-all uppercase ${
                selectedCategorySlug === cat.slug
                  ? "bg-[#D4AF37] text-[#070B12] font-bold shadow-md shadow-[#D4AF37]/20"
                  : "bg-[#0A111F] border border-[#D4AF37]/20 text-slate-200 hover:text-white hover:border-[#D4AF37]/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Categories and Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 space-y-4">
            <Sparkles className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
            <p className="font-serif text-lg tracking-wide text-slate-300">Curating the finest culinary flavours...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-[#0A111F] rounded-3xl border border-[#D4AF37]/20 p-8 max-w-md mx-auto space-y-4 shadow-xl">
            <AlertCircle className="w-10 h-10 text-[#D4AF37] mx-auto" />
            <h3 className="font-serif text-xl font-normal text-white">No Items Found</h3>
            <p className="text-xs text-slate-400">Try modifying your search term or dietary filter to explore other offerings.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setVegOnly(false);
                setSelectedCategorySlug("all");
              }}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#070B12] text-xs font-bold uppercase tracking-widest hover:bg-[#E5C378] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="space-y-6">
              {/* Category Section Header */}
              <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-sm shadow-[#D4AF37]" />
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-xs text-slate-300 mt-1 font-medium">{cat.description}</p>
                  )}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cat.items?.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className="bg-[#0A111F] rounded-3xl overflow-hidden border border-[#D4AF37]/15 hover:border-[#D4AF37]/50 shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/5 transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    {/* Item Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#0F1626]">
                      <img
                        src={item.image_url || (activeMenuTab === "FOOD" ? "/images/publiq/food/butter-chicken-delhi.webp" : "/images/publiq/drinks/publiq-gold-elixir.webp")}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = activeMenuTab === "FOOD" ? "/images/publiq/food/butter-chicken-delhi.webp" : "/images/publiq/drinks/publiq-gold-elixir.webp";
                        }}
                      />

                      {/* Dietary Indicator */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {item.is_veg ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 backdrop-blur-sm">
                            VEG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-500/50 backdrop-blur-sm">
                            NON-VEG
                          </span>
                        )}
                        {item.is_signature && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] shadow-md">
                            SIGNATURE
                          </span>
                        )}
                      </div>

                      {/* Price Badge */}
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-[#070B12]/85 text-[#D4AF37] border border-[#D4AF37]/40 shadow-lg backdrop-blur-md">
                        ₹{item.price}
                      </span>
                    </div>

                    {/* Item Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-serif text-lg font-normal text-white group-hover:text-[#D4AF37] transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                          {item.description || "Artisanal preparation with fine spices and luxury ingredients."}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-[#D4AF37]/10 flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {item.preparation_time_minutes || 15} mins
                        </span>

                        <button
                          onClick={(e) => handleQuickAdd(item, e)}
                          className="px-4 py-1.5 rounded-full bg-[#0F1626] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#070B12] border border-[#D4AF37]/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
