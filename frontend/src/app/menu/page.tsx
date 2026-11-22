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
import { FALLBACK_MENU_CATEGORIES } from "../../lib/fallbackMenu";

export default function MenuPage() {
  const { tableNumber, diningArea, isDineInActive, outletName, setTableSession } = useTableSession();
  const { addItem, itemCount } = useCart();

  // Menu Mode: Food vs Drinks
  const [activeMenuTab, setActiveMenuTab] = useState<"FOOD" | "DRINKS">("FOOD");
  const [categories, setCategories] = useState<any[]>(FALLBACK_MENU_CATEGORIES);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Sync URL ?table=, ?category=, ?tab= query parameter if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get("table");
      const urlCategory = params.get("category");
      const urlTab = params.get("tab");

      if (urlTable && (!tableNumber || tableNumber !== urlTable)) {
        const cleanedNum = urlTable.replace(/^(table-|t-)/i, "").toUpperCase();
        setTableSession({
          tableNumber: cleanedNum,
          outletName: "PUBLIQ HARAGADDE",
          outletCode: "PUB-HARAGADDE",
          diningArea: "Grand Dining Hall",
          isDineInActive: true,
        });
      }

      if (urlCategory) {
        const catClean = urlCategory.toLowerCase().trim();
        const drinkKeywords = ["cocktail", "drink", "beer", "whisky", "vodka", "rum", "gin", "wine", "brandy", "beverage", "shooter"];
        const isDrink = drinkKeywords.some(k => catClean.includes(k));
        setActiveMenuTab(isDrink ? "DRINKS" : "FOOD");
        setSelectedCategorySlug(catClean);
      } else if (urlTab) {
        if (urlTab.toUpperCase() === "DRINKS") setActiveMenuTab("DRINKS");
        if (urlTab.toUpperCase() === "FOOD") setActiveMenuTab("FOOD");
      }
    }
  }, [tableNumber, setTableSession]);

  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await api.getMenu({
          veg_only: vegOnly || undefined,
          search: searchQuery || undefined,
        });
        if (data && data.length > 0) {
          // Verify that fetched categories actually contain items
          const hasItems = data.some((c: any) => c.items && c.items.length > 0);
          if (hasItems) {
            setCategories(data);
          } else {
            console.warn("Backend categories had no items, using master catalogue fallback");
            setCategories(FALLBACK_MENU_CATEGORIES);
          }
        } else {
          setCategories(FALLBACK_MENU_CATEGORIES);
        }
      } catch (err) {
        console.warn("Using offline master catalogue fallback", err);
        setCategories(FALLBACK_MENU_CATEGORIES);
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
    const drinkSlugs = [
      "mocktails", "fresh-juices", "milkshakes", "soft-drinks-beverages",
      "signature-cocktails", "beer", "whisky", "vodka", "rum", "gin",
      "tequila-brandy", "brandy", "wine", "cocktails", "spirits", "beverages",
      "classic-cocktails", "soft-drinks", "mineral-water", "rtd-breezers", "shooters"
    ];
    return Boolean(
      cat.is_alcohol || 
      drinkSlugs.includes(cat.slug) || 
      cat.slug?.includes("water") || 
      cat.slug?.includes("drink") || 
      cat.name?.toLowerCase().includes("cocktail") ||
      cat.name?.toLowerCase().includes("beverage")
    );
  };

  // Active pool of categories (guaranteed non-empty)
  const activePool = categories.some((c: any) => c.items && c.items.length > 0)
    ? categories
    : FALLBACK_MENU_CATEGORIES;

  const filteredCategories = activePool
    .filter((cat) => {
      const isDrink = isAlcoholOrDrink(cat);
      if (activeMenuTab === "FOOD" && isDrink) return false;
      if (activeMenuTab === "DRINKS" && !isDrink) return false;
      if (selectedCategorySlug !== "all") {
        const target = selectedCategorySlug.toLowerCase();
        const catSlug = (cat.slug || "").toLowerCase();
        const catName = (cat.name || "").toLowerCase();
        const matchSlug = catSlug === target || catSlug.includes(target) || target.includes(catSlug);
        const matchName = catName.includes(target) || target.includes(catName);
        const matchCocktail = (target.includes("cocktail") && (catSlug.includes("shooter") || catSlug.includes("cocktail") || catName.includes("cocktail")));
        if (!matchSlug && !matchName && !matchCocktail) return false;
      }
      return cat.items && cat.items.length > 0;
    })
    .map((cat) => ({
      ...cat,
      items: cat.items || []
    }));

  // Fallback to all items in current tab if specific subcategory has no matches
  const displayedCategories = filteredCategories.length > 0 ? filteredCategories : activePool
    .filter((cat) => {
      const isDrink = isAlcoholOrDrink(cat);
      if (activeMenuTab === "FOOD" && isDrink) return false;
      if (activeMenuTab === "DRINKS" && !isDrink) return false;
      return cat.items && cat.items.length > 0;
    })
    .map((cat) => ({
      ...cat,
      items: cat.items || []
    }));

  // Extract subcategories for current tab (only those with available items)
  const availableSubcategories = activePool.filter((cat) => {
    const isDrink = isAlcoholOrDrink(cat);
    if (activeMenuTab === "FOOD" && isDrink) return false;
    if (activeMenuTab === "DRINKS" && !isDrink) return false;
    return cat.items && cat.items.length > 0;
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
      <div className="relative py-14 sm:py-18 border-b border-[#D4AF37]/15 bg-cover bg-center overflow-hidden" style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,17,31,0.92), rgba(7,11,18,0.96)), url('/images/publiq/backgrounds/bg-menu.webp')" }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 relative z-10">
          {/* PUBLIQ Official Crest */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-[#0B1528] p-2 border border-[#D4AF37]/50 shadow-2xl flex items-center justify-center">
            <img src="/logo.png?v=4" alt="PUBLIQ Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] block">
              PUBLIQ BAR &amp; RESTAURANT
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-white">
              An Experience <span className="italic text-[#D4AF37]">Beyond Dining</span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Discover our complete 281-creation gastronomic collection, from charcoal clay oven tikkas and rich dum biryanis to artisan mixology and rare reserve single malts.
          </p>

          {/* DUAL MENU SWITCHER: FOOD MENU VS DRINKS MENU */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-[#0A111F] border-2 border-[#D4AF37]/50 shadow-2xl gap-2">
              <button
                onClick={() => {
                  setActiveMenuTab("FOOD");
                  setSelectedCategorySlug("all");
                }}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 ${
                  activeMenuTab === "FOOD"
                    ? "bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#070B12] shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-105"
                    : "text-slate-300 hover:text-white bg-[#070B12]/60"
                }`}
              >
                <UtensilsCrossed className="w-5 h-5 text-current" />
                <span>🍲 FOOD MENU</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuTab("DRINKS");
                  setSelectedCategorySlug("all");
                }}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 ${
                  activeMenuTab === "DRINKS"
                    ? "bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#070B12] shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-105"
                    : "text-slate-300 hover:text-white bg-[#070B12]/60"
                }`}
              >
                <Wine className="w-5 h-5 text-current" />
                <span>🍸 DRINKS MENU</span>
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
        ) : displayedCategories.length === 0 ? (
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
          displayedCategories.map((cat) => (
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
                        ₹{item.base_price ?? item.price}
                      </span>
                    </div>

                    {/* Item Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-serif text-lg font-normal text-white group-hover:text-[#D4AF37] transition-colors">
                          {item.name}
                        </h3>
                        {item.variants && item.variants.length > 1 ? (
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {item.variants.map((v: any) => (
                              <span
                                key={v.id}
                                className="text-[10px] text-amber-200 font-semibold bg-[#0F1626] px-2 py-0.5 rounded-md border border-[#D4AF37]/40"
                              >
                                {v.name}: ₹{Math.round(item.base_price + v.price_delta)}
                              </span>
                            ))}
                          </div>
                        ) : item.serving_size ? (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#0F1626] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                              {item.serving_size}
                            </span>
                          </div>
                        ) : null}
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
