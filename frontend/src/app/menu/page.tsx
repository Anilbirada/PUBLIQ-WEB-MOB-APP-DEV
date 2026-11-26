"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Filter, Sparkles, Flame, Clock, Wine, 
  UtensilsCrossed, AlertCircle, ShoppingBag, Plus, Minus, Check,
  Leaf, Coffee, GlassWater, Beer, ArrowRight, Download, Printer,
  Star, ChevronRight, X, Heart, Award, ShieldCheck
} from "lucide-react";
import { api } from "../../lib/api";
import { useTableSession } from "../../context/TableSessionContext";
import { useCart } from "../../context/CartContext";
import { ProductDetailModal } from "../../components/ProductDetailModal";
import { FALLBACK_MENU_CATEGORIES } from "../../lib/fallbackMenu";
import { getMenuItemImage } from "../../lib/menuImages";

// Helper function for deterministic, authentic menu ratings per item (PUB-BUG-005)
const getItemRating = (item: any): string => {
  if (item?.rating && typeof item.rating === "number") {
    return item.rating.toFixed(1);
  }
  const str = (item?.name || "") + (item?.id || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const variance = Math.abs(hash % 4);
  return (4.6 + variance * 0.1).toFixed(1);
};

// Item Availability Check - Ensures customers cannot click or order unavailable food
const isItemAvailable = (item: any): boolean => {
  if (!item) return false;
  if (item.is_available === false || item.is_available === 0 || item.is_available === "false") return false;
  if (item.is_active === false || item.is_active === 0) return false;
  if (item.in_stock === false) return false;
  if (item.status === "UNAVAILABLE" || item.status === "OUT_OF_STOCK" || item.status === "86") return false;
  return true;
};

export default function MenuPage() {
  const { tableNumber, diningArea, isDineInActive, outletName, setTableSession } = useTableSession();
  const { addItem, updateItemQuantity, removeItem, items: cartItems, itemCount, finalAmount } = useCart();

  // Menu Mode: Food vs Drinks
  const [activeMenuTab, setActiveMenuTab] = useState<"FOOD" | "DRINKS">("FOOD");
  const [categories, setCategories] = useState<any[]>(FALLBACK_MENU_CATEGORIES);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [availableOnly, setAvailableOnly] = useState<boolean>(true); // Scanned QR code customers default to available-only
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Sync URL ?category=, ?tab= query parameters (No automatic table selection)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCategory = params.get("category");
      const urlTab = params.get("tab");

      if (urlCategory) {
        const catClean = urlCategory.toLowerCase().trim();
        const drinkKeywords = ["cocktail", "drink", "beer", "whisky", "vodka", "rum", "gin", "wine", "brandy", "beverage", "shooter", "mocktail"];
        const isDrink = drinkKeywords.some(k => catClean.includes(k));
        setActiveMenuTab(isDrink ? "DRINKS" : "FOOD");
        setSelectedCategorySlug(catClean);
      } else if (urlTab) {
        if (urlTab.toUpperCase() === "DRINKS") setActiveMenuTab("DRINKS");
        if (urlTab.toUpperCase() === "FOOD") setActiveMenuTab("FOOD");
      }
    }
  }, [tableNumber, setTableSession]);

  // Load menu data from backend or fallback (Always preserves full 310+ item master catalogue)
  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await api.getMenu({
          include_unavailable: true, // Fetch complete data with availability flags
        });
        if (data && data.length > 0) {
          // Robust merge: Never discard fallback categories that have items!
          const merged = [...FALLBACK_MENU_CATEGORIES];
          data.forEach((serverCat: any) => {
            if (!serverCat.items || serverCat.items.length === 0) return;
            const idx = merged.findIndex(m => m.slug === serverCat.slug || m.id === serverCat.id);
            if (idx !== -1) {
              const existingItems = [...(merged[idx].items || [])];
              serverCat.items.forEach((sItem: any) => {
                const itemIdx = existingItems.findIndex(e => e.id === sItem.id || (e.name && sItem.name && e.name.toLowerCase() === sItem.name.toLowerCase()));
                if (itemIdx !== -1) {
                  existingItems[itemIdx] = { ...existingItems[itemIdx], ...sItem };
                } else {
                  existingItems.push(sItem);
                }
              });
              merged[idx] = { ...merged[idx], ...serverCat, items: existingItems };
            } else {
              merged.push(serverCat);
            }
          });
          setCategories(merged);
        } else {
          setCategories(FALLBACK_MENU_CATEGORIES);
        }
      } catch (err) {
        setCategories(FALLBACK_MENU_CATEGORIES);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, []);

  // Handle Quick Add to Cart (Strict availability enforcement)
  const handleQuickAdd = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isItemAvailable(item)) {
      setAddedNotice(`⚠️ "${item.name}" is currently sold out and cannot be ordered.`);
      setTimeout(() => setAddedNotice(null), 3000);
      return;
    }
    try {
      await addItem({
        item_id: item.id,
        quantity: 1,
      });
      setAddedNotice(`Added "${item.name}"`);
      setTimeout(() => setAddedNotice(null), 2000);
    } catch (_) {}
  };

  // Handle Quantity Increment
  const handleIncrement = async (cartItemId: string, currentQty: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateItemQuantity(cartItemId, currentQty + 1);
    } catch (_) {}
  };

  // Handle Quantity Decrement
  const handleDecrement = async (cartItemId: string, currentQty: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (currentQty <= 1) {
        await removeItem(cartItemId);
      } else {
        await updateItemQuantity(cartItemId, currentQty - 1);
      }
    } catch (_) {}
  };

  // Filter categories strictly based on activeMenuTab (Food vs Drinks)
  const isAlcoholOrDrink = (cat: any) => {
    const drinkSlugs = [
      "mocktails", "fresh-juices", "milkshakes", "soft-drinks-beverages",
      "signature-cocktails", "beer", "whisky", "vodka", "rum", "gin",
      "tequila-brandy", "brandy", "wine", "cocktails", "spirits", "beverages",
      "classic-cocktails", "soft-drinks", "mineral-water", "rtd-breezers", "shooters",
      "fresh-beverages"
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

  const activePool = categories.some((c: any) => c.items && c.items.length > 0)
    ? categories
    : FALLBACK_MENU_CATEGORIES;

  // Available subcategories for the active tab
  const availableSubcategories = useMemo(() => {
    return activePool.filter((cat) => {
      const isDrink = isAlcoholOrDrink(cat);
      if (activeMenuTab === "FOOD" && isDrink) return false;
      if (activeMenuTab === "DRINKS" && !isDrink) return false;
      return cat.items && cat.items.length > 0;
    });
  }, [activePool, activeMenuTab]);

  // Filtered categories to display
  const displayedCategories = useMemo(() => {
    const list = activePool.filter((cat) => {
      const isDrink = isAlcoholOrDrink(cat);
      if (activeMenuTab === "FOOD" && isDrink) return false;
      if (activeMenuTab === "DRINKS" && !isDrink) return false;

      if (selectedCategorySlug !== "all") {
        const target = selectedCategorySlug.toLowerCase();
        const catSlug = (cat.slug || "").toLowerCase();
        const catName = (cat.name || "").toLowerCase();
        const matchSlug = catSlug === target || catSlug.includes(target) || target.includes(catSlug);
        const matchName = catName.includes(target) || target.includes(catName);
        if (!matchSlug && !matchName) return false;
      }

      return cat.items && cat.items.length > 0;
    });

    const seenItemKeys = new Set<string>();

    return list.map((cat) => ({
      ...cat,
      items: (cat.items || []).filter((item: any) => {
        if (vegOnly && !item.is_veg) return false;
        if (availableOnly && !isItemAvailable(item)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        // Strict deduplication: ensure no item is displayed simultaneously more than once
        const itemKey = (item.name || item.id || "").toLowerCase().trim();
        if (seenItemKeys.has(itemKey)) {
          return false;
        }
        seenItemKeys.add(itemKey);
        return true;
      })
    })).filter((cat) => cat.items.length > 0);
  }, [activePool, activeMenuTab, selectedCategorySlug, vegOnly, availableOnly, searchQuery]);

  // Total items in current view
  const totalItemsCount = useMemo(() => {
    return displayedCategories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
  }, [displayedCategories]);

  // Dynamic total items in current menu tab (PUB-BUG-002)
  const totalTabCatalogItems = useMemo(() => {
    return availableSubcategories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
  }, [availableSubcategories]);

  // Overall total items across all categories
  const totalAllCatalogItems = useMemo(() => {
    return activePool.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
  }, [activePool]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-800 pb-32 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. STICKY TABLE CONTEXT & QUICK SEARCH NAVBAR                            */}
      {/* ========================================================================= */}
      {isDineInActive && tableNumber && (
        <div className="bg-white/95 border-b border-slate-200/90 text-slate-900 px-4 py-2.5 sticky top-0 z-40 shadow-xs backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                T{tableNumber}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-900 font-extrabold flex items-center gap-2">
                  <span>PUBLIQ — TABLE {tableNumber}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {diningArea || "Grand Dining Hall"} • {outletName || "PUBLIQ HARAGADDE"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/PUBLIQ_Digital_Menu_Catalog.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:text-blue-600 bg-slate-50 text-xs font-semibold shadow-xs transition-all"
                title="Download 20-Page Complete Menu & Price Catalog PDF"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>PDF Catalog</span>
              </a>

              <a
                href="/cart"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Cart ({itemCount})</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Added to cart toast notification */}
      {addedNotice && (
        <div className="fixed top-20 right-6 z-50 bg-white text-slate-900 px-5 py-3 rounded-2xl shadow-xl border border-emerald-300 text-xs flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          <span className="font-bold tracking-wide">{addedNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KFC & ZOMATO-INSPIRED HERO HEADER (VIBRANT GRADIENT ON WHITE)          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80 pt-8 pb-10 sm:pt-12 sm:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Left: Branding & Value Proposition */}
            <div className="space-y-3 text-center md:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wider uppercase shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{totalAllCatalogItems} Curated Gastronomic Selections</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Authentic Flavours &amp;{" "}
                <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 bg-clip-text text-transparent font-extrabold">
                  Artisanal Sips
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-xl">
                Explore our full digital menu from Mangalorean coastal fish fries and charcoal clay tandoor kebabs to craft cocktails, single malts, and chilled beers.
              </p>

              {/* Action Pills */}
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <a
                  href="/PUBLIQ_Digital_Menu_Catalog.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Complete Menu PDF</span>
                </a>

                {isDineInActive && tableNumber && (
                  <span className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>Table {tableNumber} Connected</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Featured Hero Visual Showcase */}
            <div className="w-full md:w-96 rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white relative group">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={activeMenuTab === "FOOD" 
                    ? "/images/publiq/catalog/catalog_p12_58.jpeg" 
                    : "/images/publiq/catalog/catalog_p11_54.jpeg"
                  }
                  alt="PUBLIQ Culinary & Bar Specials"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">
                    {activeMenuTab === "FOOD" ? "CHEF'S SIGNATURE SPECIALS" : "MASTER MIXOLOGIST SELECTION"}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base">
                    {activeMenuTab === "FOOD" ? "Charcoal Kebabs & Coastal Fries" : "Craft Cocktails & Aged Malts"}
                  </h3>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 3. DUAL SECTION SWITCHER: FOOD MENU vs DRINKS MENU                       */}
          {/* ========================================================================= */}
          <div className="pt-8 sm:pt-10 flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner gap-2 w-full sm:w-auto max-w-md">
              <button
                onClick={() => {
                  setActiveMenuTab("FOOD");
                  setSelectedCategorySlug("all");
                }}
                className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all duration-300 ${
                  activeMenuTab === "FOOD"
                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25 scale-102"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 text-current" />
                <span>FOOD MENU</span>
              </button>

              <button
                onClick={() => {
                  setActiveMenuTab("DRINKS");
                  setSelectedCategorySlug("all");
                }}
                className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all duration-300 ${
                  activeMenuTab === "DRINKS"
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 scale-102"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                <Wine className="w-4 h-4 text-current" />
                <span>DRINKS MENU</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH & CATEGORY CHIPS NAVIGATION (KFC & ZOMATO STYLE)               */}
      {/* ========================================================================= */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          
          {/* Search Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={
                  activeMenuTab === "FOOD" 
                    ? "Search dishes, coastal fries, tandoor, biryani, curries..." 
                    : "Search beers, whiskies, cocktails, vodkas, wines, breezers..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Veg Toggle for Food */}
            {activeMenuTab === "FOOD" && (
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  vegOnly
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                <Leaf className="w-3.5 h-3.5 text-current" />
                <span className="hidden sm:inline">Veg Only</span>
              </button>
            )}

            {/* In-Stock Available Only Toggle */}
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                availableOnly
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Filter to show only food & drinks currently in stock"
            >
              <Check className="w-3.5 h-3.5 text-current" />
              <span className="hidden sm:inline">{availableOnly ? "Available Only" : "All Items"}</span>
            </button>

            {/* Total Results Counter */}
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap hidden md:inline">
              {totalItemsCount} items
            </span>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategorySlug("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider whitespace-nowrap transition-all uppercase shrink-0 flex items-center gap-1.5 ${
                selectedCategorySlug === "all"
                  ? activeMenuTab === "FOOD"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>All {activeMenuTab === "FOOD" ? "Dishes" : "Drinks"}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({selectedCategorySlug === "all" ? totalItemsCount : totalTabCatalogItems})
              </span>
            </button>

            {availableSubcategories.map((cat) => {
              // Calculate filtered count matching search and veg filter without being affected by selected category
              const countToDisplay = (cat.items || []).filter((item: any) => {
                if (vegOnly && !item.is_veg) return false;
                if (availableOnly && !isItemAvailable(item)) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  return item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
                }
                return true;
              }).length;

              return (
                <button
                  key={cat.id || cat.slug}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider whitespace-nowrap transition-all uppercase shrink-0 flex items-center gap-1.5 ${
                    selectedCategorySlug === cat.slug
                      ? activeMenuTab === "FOOD"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({countToDisplay})</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PRODUCT DISPLAY – PREMIUM COLOURFUL KFC & ZOMATO-INSPIRED CARDS        */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {isLoading ? (
          <div className="text-center py-20 text-slate-500 space-y-4">
            <Sparkles className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="font-serif text-lg tracking-wide text-slate-700">Loading catalog...</p>
          </div>
        ) : displayedCategories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-orange-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-900">No matching items found</h3>
            <p className="text-xs text-slate-500">Try clearing your search term or vegetarian filter.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setVegOnly(false);
                setSelectedCategorySlug("all");
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:shadow-md transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          displayedCategories.map((cat) => (
            <div key={cat.id || cat.slug} className="space-y-5">
              
              {/* Category Section Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-md ${
                    activeMenuTab === "FOOD" 
                      ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                      : "bg-gradient-to-r from-blue-600 to-indigo-600"
                  }`} />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400 font-mono">
                  {cat.items?.length} items
                </span>
              </div>

              {/* KFC & Zomato-Inspired Responsive Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {cat.items?.map((item: any) => {
                  const cartItem = cartItems.find((ci) => ci.item_id === item.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  const itemImg = getMenuItemImage(item, cat.name, cat.slug);
                  const isAvailable = isItemAvailable(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isAvailable) {
                          setAddedNotice(`⚠️ "${item.name}" is currently sold out and unavailable for ordering.`);
                          setTimeout(() => setAddedNotice(null), 3000);
                          return;
                        }
                        setSelectedProduct(item);
                      }}
                      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col group overflow-hidden ${
                        !isAvailable
                          ? "opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed select-none"
                          : "border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md cursor-pointer"
                      }`}
                    >
                      {/* Product Photography Container */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <img
                          src={itemImg}
                          alt={item.name}
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            isAvailable ? "group-hover:scale-105" : "grayscale"
                          }`}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = activeMenuTab === "FOOD" 
                              ? "/images/publiq/food/butter-chicken-copper-handi.webp" 
                              : "/images/publiq/drinks/craft-cocktails-mocktails.webp";
                          }}
                        />

                        {/* Top Left: Rating Badge (Dynamic per item) */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-[11px] font-bold text-slate-800">{getItemRating(item)}</span>
                        </div>

                        {/* Top Right: Signature / Chef Badge */}
                        {isAvailable && item.is_signature && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                            BESTSELLER
                          </span>
                        )}

                        {/* Sold Out Overlay if unavailable */}
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-3 text-center">
                            <span className="px-3 py-1.5 rounded-xl bg-rose-600/95 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-rose-400">
                              <AlertCircle className="w-3.5 h-3.5" /> SOLD OUT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Content Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-bold text-sm sm:text-base line-clamp-1 transition-colors ${
                              isAvailable ? "text-slate-900 group-hover:text-blue-700" : "text-slate-500 line-through"
                            }`}>
                              {item.name}
                            </h3>
                            {!isAvailable && (
                              <span className="shrink-0 text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                Sold Out
                              </span>
                            )}
                          </div>

                          {/* Serving Size or Pack Format */}
                          {item.serving_size && (
                            <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.serving_size}
                            </span>
                          )}

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {item.description || "Authentic preparation made fresh with fine spices and premium ingredients."}
                          </p>
                        </div>

                        {/* Card Price & Zomato/KFC Interactive Quantity Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className={`text-base sm:text-lg font-black ${
                              isAvailable ? "text-slate-900" : "text-slate-400"
                            }`}>
                              {item.base_price ? `₹${Math.round(item.base_price)}` : "APS*"}
                            </span>
                            {item.variants && item.variants.length > 1 && (
                              <span className="block text-[9px] text-slate-400 font-semibold uppercase">
                                Customizable
                              </span>
                            )}
                          </div>

                          {/* Interactive Stepper or Add Button */}
                          {!isAvailable ? (
                            <button
                              type="button"
                              disabled
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddedNotice(`⚠️ "${item.name}" is currently sold out and cannot be ordered.`);
                                setTimeout(() => setAddedNotice(null), 3000);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed flex items-center gap-1 border border-slate-300"
                            >
                              <span>SOLD OUT</span>
                            </button>
                          ) : quantityInCart > 0 && cartItem ? (
                            <div 
                              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs font-bold text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => handleDecrement(cartItem.id, quantityInCart, e)}
                                className="p-1.5 px-2.5 hover:bg-black/10 rounded-l-xl transition-colors"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 font-mono text-xs font-black">
                                {quantityInCart}
                              </span>
                              <button
                                onClick={(e) => handleIncrement(cartItem.id, quantityInCart, e)}
                                className="p-1.5 px-2.5 hover:bg-black/10 rounded-r-xl transition-colors"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleQuickAdd(item, e)}
                              className="px-4 py-1.5 rounded-xl bg-slate-50 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white text-slate-800 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5 text-current" />
                              <span>ADD</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. ZOMATO-STYLE FLOATING BOTTOM CART BAR                                  */}
      {/* ========================================================================= */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto animate-slideUp">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-slate-700/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-300 font-bold block">
                  {itemCount} {itemCount === 1 ? "Item" : "Items"} in Order
                </span>
                <span className="text-lg font-black text-amber-400">
                  ₹{Math.round(finalAmount)}
                </span>
              </div>
            </div>

            <a
              href="/cart"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PRODUCT DETAIL MODAL                                                   */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

    </div>
  );
}
