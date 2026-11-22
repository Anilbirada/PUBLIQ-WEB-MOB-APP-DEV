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
          // Merge with fallback to ensure both food and drinks are always fully stocked
          const hasDrinks = data.some((c: any) => (c.is_alcohol || c.slug === "beer" || c.slug === "cocktails") && c.items?.length > 0);
          const hasFood = data.some((c: any) => (!c.is_alcohol) && c.items?.length > 0);

          if (hasDrinks && hasFood) {
            setCategories(data);
          } else {
            // Smart merge: retain fallback items for missing sections
            const merged = [...FALLBACK_MENU_CATEGORIES];
            data.forEach((serverCat: any) => {
              const idx = merged.findIndex(m => m.slug === serverCat.slug);
              if (idx !== -1 && serverCat.items && serverCat.items.length > 0) {
                merged[idx] = serverCat;
              } else if (idx === -1 && serverCat.items && serverCat.items.length > 0) {
                merged.push(serverCat);
              }
            });
            setCategories(merged);
          }
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-24 font-sans selection:bg-blue-600 selection:text-white">
      {/* Table Context Sticky Banner if Dine-In */}
      {isDineInActive && tableNumber && (
        <div className="bg-white/95 border-b border-slate-200 text-slate-900 px-4 py-2.5 sticky top-0 z-40 shadow-xs backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                {tableNumber}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-blue-700 font-bold">
                  PUBLIQ — TABLE {tableNumber}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {diningArea || "Grand Dining Hall"} • {outletName || "PUBLIQ HARAGADDE"}
                </div>
              </div>
            </div>
            <a
              href="/cart"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Summary ({itemCount})</span>
            </a>
          </div>
        </div>
      )}

      {/* Added to cart toast notification */}
      {addedNotice && (
        <div className="fixed top-24 right-6 z-50 bg-white text-slate-900 px-5 py-3 rounded-2xl shadow-xl border border-emerald-200 text-xs flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold tracking-wide">{addedNotice}</span>
        </div>
      )}

      {/* Hero Header (Pure White Background with Elegant Multi-Gradient Highlights) */}
      <div className="bg-white border-b border-slate-200/80 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          {/* PUBLIQ Crest */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-2 border border-blue-100 shadow-xs flex items-center justify-center">
            <img src="/logo.png?v=4" alt="PUBLIQ Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-blue-700 block">
              PUBLIQ BAR & RESTAURANT
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              An Experience <span className="italic bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Beyond Dining</span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover our complete 281-creation gastronomic collection, from charcoal clay oven tikkas and rich dum biryanis to artisan mixology and rare reserve single malts.
          </p>

          {/* DUAL MENU SWITCHER: FOOD MENU VS DRINKS MENU */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner gap-2">
              <button
                onClick={() => {
                  setActiveMenuTab("FOOD");
                  setSelectedCategorySlug("all");
                }}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all duration-300 ${
                  activeMenuTab === "FOOD"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-102"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 text-current" />
                <span>🍛 FOOD MENU</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuTab("DRINKS");
                  setSelectedCategorySlug("all");
                }}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all duration-300 ${
                  activeMenuTab === "DRINKS"
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 scale-102"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                <Wine className="w-4 h-4 text-current" />
                <span>🍸 DRINKS MENU</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-blue-600 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder={activeMenuTab === "FOOD" ? "Search kebabs, curries, breads, biryanis..." : "Search single malts, cocktails, gins, wines..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all"
            />
          </div>

          {/* Secondary Filters */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {activeMenuTab === "FOOD" && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Pure Vegetarian Only
                </span>
              </label>
            )}

            <a
              href="/cart"
              className="relative p-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 border border-slate-200 transition-all shadow-xs"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {itemCount}
                </span>
              )}
            </a>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategorySlug("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider whitespace-nowrap transition-all uppercase ${
              selectedCategorySlug === "all"
                ? activeMenuTab === "FOOD"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            All {activeMenuTab === "FOOD" ? "Dishes" : "Beverages"}
          </button>
          {availableSubcategories.map((cat) => (
            <button
              key={cat.id || cat.slug}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider whitespace-nowrap transition-all uppercase ${
                selectedCategorySlug === cat.slug
                  ? activeMenuTab === "FOOD"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Categories and Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {isLoading ? (
          <div className="text-center py-20 text-slate-500 space-y-4">
            <Sparkles className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="font-serif text-lg tracking-wide text-slate-700">Curating the finest culinary flavours...</p>
          </div>
        ) : displayedCategories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto space-y-4 shadow-xs">
            <AlertCircle className="w-10 h-10 text-blue-600 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-slate-900">No Items Found</h3>
            <p className="text-xs text-slate-500">Try modifying your search term or dietary filter to explore other offerings.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setVegOnly(false);
                setSelectedCategorySlug("all");
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:shadow-md transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          displayedCategories.map((cat) => (
            <div key={cat.id || cat.slug} className="space-y-5">
              {/* Category Section Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <div className={`w-3 h-3 rounded-full ${
                  activeMenuTab === "FOOD" ? "bg-amber-500" : "bg-blue-600"
                }`} />
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{cat.description}</p>
                  )}
                </div>
              </div>

              {/* Items Grid (Crisp White Product Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cat.items?.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    {/* Item Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-emerald-700 border border-emerald-300 shadow-xs backdrop-blur-sm">
                            VEG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-rose-700 border border-rose-300 shadow-xs backdrop-blur-sm">
                            NON-VEG
                          </span>
                        )}
                        {item.is_signature && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                            SIGNATURE
                          </span>
                        )}
                      </div>

                      {/* Price Badge */}
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-white/95 text-slate-900 border border-slate-200 shadow-xs backdrop-blur-md">
                        ₹{item.base_price ?? item.price}
                      </span>
                    </div>

                    {/* Item Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-serif text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {item.name}
                        </h3>
                        {item.variants && item.variants.length > 1 ? (
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {item.variants.map((v: any) => (
                              <span
                                key={v.id}
                                className="text-[10px] text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200"
                              >
                                {v.name}: ₹{Math.round(item.base_price + v.price_delta)}
                              </span>
                            ))}
                          </div>
                        ) : item.serving_size ? (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              {item.serving_size}
                            </span>
                          </div>
                        ) : null}
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                          {item.description || "Artisanal preparation with fine spices and premium ingredients."}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {item.preparation_time_minutes || 15} mins
                        </span>

                        <button
                          onClick={(e) => handleQuickAdd(item, e)}
                          className="px-4 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
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
