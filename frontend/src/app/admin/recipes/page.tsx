"use client";

import React, { useState, useEffect } from "react";
import { 
  ChefHat, Percent, DollarSign, TrendingUp, 
  Layers, Search, Eye, Sparkles, AlertCircle, ArrowUpRight, X
} from "lucide-react";


const API_BASE = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')) || 'http://localhost:8001/api/v1';
interface Ingredient {
  name: string;
  quantity: string;
  cost: number;
}

interface Recipe {
  id: string;
  menu_item_name: string;
  category: string;
  food_cost: number;
  selling_price: number;
  gross_margin_percent: number;
  yield: string;
  ingredients: Ingredient[];
}

const FALLBACK_RECIPES: Recipe[] = [
  {
    id: "rec-1",
    menu_item_name: "Charcoal Kalmi Kebab",
    category: "Starters",
    food_cost: 124.0,
    selling_price: 440.0,
    gross_margin_percent: 71.8,
    yield: "1 Portion (2 Pcs)",
    ingredients: [
      { name: "Fresh Chicken Drumsticks", quantity: "0.35 KG", cost: 84.0 },
      { name: "Hung Curd & Marinade Spices", quantity: "0.08 KG", cost: 22.0 },
      { name: "Amul Pure Desi Cow Ghee", quantity: "0.03 KG", cost: 18.0 }
    ]
  },
  {
    id: "rec-2",
    menu_item_name: "Old Delhi Butter Chicken",
    category: "Main Course",
    food_cost: 145.0,
    selling_price: 490.0,
    gross_margin_percent: 70.4,
    yield: "1 Handi Bowl (450g)",
    ingredients: [
      { name: "Boneless Chicken Thigh Tikka", quantity: "0.28 KG", cost: 72.0 },
      { name: "San Marzano Makhani Gravy", quantity: "0.25 L", cost: 38.0 },
      { name: "Heavy Dairy Cream & White Butter", quantity: "0.06 KG", cost: 35.0 }
    ]
  },
  {
    id: "rec-3",
    menu_item_name: "PUBLIQ 24-Hour Dal Makhani",
    category: "Main Course",
    food_cost: 68.0,
    selling_price: 375.0,
    gross_margin_percent: 81.8,
    yield: "1 Handi Bowl (400g)",
    ingredients: [
      { name: "Whole Black Urad Lentils", quantity: "0.15 KG", cost: 21.75 },
      { name: "White Butter & Cow Cream", quantity: "0.06 KG", cost: 34.0 },
      { name: "Tomato Reduction & Spices", quantity: "0.10 KG", cost: 12.25 }
    ]
  },
  {
    id: "rec-4",
    menu_item_name: "Smoked Bourbon Old Fashioned",
    category: "Craft Cocktails",
    food_cost: 142.0,
    selling_price: 580.0,
    gross_margin_percent: 75.5,
    yield: "1 Cocktail (180ml)",
    ingredients: [
      { name: "Buffalo Trace Bourbon", quantity: "60 ml", cost: 116.0 },
      { name: "Angostura Bitters & Demerara", quantity: "1 Dash", cost: 16.0 },
      { name: "Hand-Carved Ice & Applewood Smoke", quantity: "1 Set", cost: 10.0 }
    ]
  },
  {
    id: "rec-5",
    menu_item_name: "Glenfiddich 12 Yrs Speyside (30ml Peg)",
    category: "Single Malt",
    food_cost: 152.0,
    selling_price: 650.0,
    gross_margin_percent: 76.6,
    yield: "1 Peg (30 ml)",
    ingredients: [
      { name: "Glenfiddich 12 Yrs Single Malt", quantity: "30 ml", cost: 152.0 }
    ]
  }
];

export default function RecipeCostingPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(FALLBACK_RECIPES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/inventory/recipes`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setRecipes(data);
        }
      } catch {
        // fallback
      }
    };
    fetchRecipes();
  }, []);

  const filtered = recipes.filter(r => 
    r.menu_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgMargin = Math.round(
    recipes.reduce((acc, r) => acc + r.gross_margin_percent, 0) / recipes.length
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1528]/80 backdrop-blur-md border border-[#38BDF8]/25 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-[#38BDF8] font-bold flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-[#D4AF37]" /> Culinary Engineering & Cost Control
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Recipe Engineering & Food Costing
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingredient consumption mapping, portion costing, gross margin targets, and automated stock deductions.
          </p>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Engineered Recipes</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{recipes.length}</span>
            <span className="text-xs font-semibold text-[#38BDF8] bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#38BDF8]/30">Active Cost Cards</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Gross Margin</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-emerald-400">{avgMargin}%</span>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-400/30">Target &gt;70%</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Food Cost %</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{100 - avgMargin}%</span>
            <span className="text-xs font-semibold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-400/30">Benchmark &lt;30%</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Auto-Deduction Engine</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl font-bold text-emerald-400">ACTIVE</span>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-400/30">KOT Triggered</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl p-5 shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search engineered recipe or dish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070E1A] border border-[#38BDF8]/20 text-white placeholder-slate-500 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
      </div>

      {/* 4. Recipes Table */}
      <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070E1A] text-slate-300 uppercase tracking-wider border-b border-[#38BDF8]/25">
              <tr>
                <th className="py-3.5 px-5 font-bold">Recipe Name</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Yield</th>
                <th className="py-3.5 px-4 font-bold text-right">Food / Beverage Cost</th>
                <th className="py-3.5 px-4 font-bold text-right">Selling Price</th>
                <th className="py-3.5 px-4 font-bold text-center">Cost %</th>
                <th className="py-3.5 px-4 font-bold text-center">Gross Margin %</th>
                <th className="py-3.5 px-5 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#38BDF8]/15">
              {filtered.map(r => {
                const costPercent = Math.round((r.food_cost / r.selling_price) * 100);
                return (
                  <tr key={r.id} className="hover:bg-[#0F223D]/50 transition-colors">
                    <td className="py-4 px-5 font-serif font-bold text-white text-sm">
                      {r.menu_item_name}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[#070E1A] border border-[#38BDF8]/20 text-[#38BDF8] text-xs font-semibold">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-medium">
                      {r.yield}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-white">
                      ₹{r.food_cost.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-serif font-bold text-white text-sm">
                      ₹{r.selling_price.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono text-white font-bold text-xs bg-[#070E1A] px-2 py-0.5 rounded border border-[#38BDF8]/20">{costPercent}%</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full font-bold text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        {r.gross_margin_percent}%
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedRecipe(r)}
                        className="px-3.5 py-1.5 bg-[#070E1A] hover:bg-[#0B1528] text-[#38BDF8] hover:text-white border border-[#38BDF8]/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#38BDF8]" /> View Breakdown
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Recipe Breakdown Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border border-[#38BDF8]/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#38BDF8]/20 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#38BDF8] font-bold">Standard Cost Sheet</span>
                <h3 className="font-serif text-2xl font-bold text-white">{selectedRecipe.menu_item_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Yield: {selectedRecipe.yield}</p>
              </div>
              <button 
                onClick={() => setSelectedRecipe(null)} 
                className="w-8 h-8 rounded-full bg-[#070E1A] text-slate-300 flex items-center justify-center hover:bg-[#38BDF8] hover:text-black transition-colors border border-[#38BDF8]/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-[#070E1A] p-4 rounded-2xl border border-[#38BDF8]/20 text-center shadow-sm">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Food Cost</p>
                  <p className="font-serif text-base font-bold text-white mt-0.5">₹{selectedRecipe.food_cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Menu Price</p>
                  <p className="font-serif text-base font-bold text-[#D4AF37] mt-0.5">₹{selectedRecipe.selling_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gross Margin</p>
                  <p className="font-serif text-base font-bold text-emerald-400 mt-0.5">{selectedRecipe.gross_margin_percent}%</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-300 mb-2">Configured Raw Ingredients</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#070E1A] border border-[#38BDF8]/20 text-xs">
                      <div>
                        <p className="text-white font-bold">{ing.name}</p>
                        <p className="text-[11px] text-slate-400">Consumption: {ing.quantity}</p>
                      </div>
                      <span className="font-serif font-bold text-[#38BDF8] text-sm">₹{ing.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#38BDF8]/20">
              <span className="text-[11px] text-slate-400">Auto-deducts from stock on KOT order acceptance</span>
              <button
                type="button"
                onClick={() => setSelectedRecipe(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-bold rounded-full text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
