"use client";

import React from "react";
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, 
  Sparkles, ShieldCheck, ArrowLeft, UtensilsCrossed, Wine
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useTableSession } from "../../context/TableSessionContext";

export default function CartPage() {
  const { 
    items, itemCount, subtotal, foodSubtotal, beverageSubtotal, cgst, sgst, totalTax, 
    packagingFee, deliveryFee, finalAmount, updateItemQuantity, 
    removeItem, clearCart, isLoading 
  } = useCart();
  const { tableNumber, diningArea, isDineInActive, outletName } = useTableSession();

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-6 border border-slate-200/90 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-xs">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900">
              Your Order is Empty
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
              Explore our sizzling tandoori kebabs, rich butter chicken, flavorful biryanis, and refreshing craft cocktails.
            </p>
          </div>
          <a
            href="/menu"
            className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs uppercase tracking-wider hover:shadow-lg transition-all shadow-md shadow-blue-500/25"
          >
            <span>Explore Menu & Add Items</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-10 sm:py-14 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
          <div className="flex items-center gap-3">
            <a href="/menu" className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-xs">
              <ArrowLeft className="w-5 h-5 text-blue-600" />
            </a>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900">
                Your Order ({itemCount} {itemCount === 1 ? "item" : "items"})
              </h1>
              {isDineInActive && tableNumber ? (
                <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dine-In • Table {tableNumber} ({diningArea || "Grand Dining Hall"})</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Review your selected food and drinks, then proceed to checkout.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex gap-4"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={item.item_image || "/images/publiq/food_signature.webp"}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/images/publiq/food_signature.webp";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-base font-bold text-slate-900">
                        {item.item_name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.variant_name && (
                      <span className="text-[11px] font-semibold text-blue-700 block mt-0.5">
                        Portion: {item.variant_name}
                      </span>
                    )}

                    {item.selected_addons && item.selected_addons.length > 0 && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        + {item.selected_addons.map((a) => `${a.name} (₹${a.price})`).join(", ")}
                      </div>
                    )}

                    {item.special_request && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 mt-1.5 inline-block font-medium">
                        Note: {item.special_request}
                      </p>
                    )}
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-serif text-base font-black text-slate-900">
                      ₹{item.total_price}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <a
              href="/menu"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline pt-2 tracking-wide"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add more culinary dishes or craft beverages</span>
            </a>
          </div>

          {/* Bill Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5 sticky top-20">
              <h2 className="font-serif text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Financial Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal</span>
                  <span className="font-serif font-bold text-slate-900">₹{subtotal}</span>
                </div>

                {/* Dual-Business Food vs Drinks Subtotals */}
                {(foodSubtotal > 0 || beverageSubtotal > 0) && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 my-1">
                    {foodSubtotal > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                          <span>Food (Proprietor: Ramesh S P)</span>
                        </span>
                        <span className="font-serif font-bold text-amber-800">₹{foodSubtotal}</span>
                      </div>
                    )}
                    {beverageSubtotal > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Wine className="w-3.5 h-3.5 text-blue-600" />
                          <span>Drinks (Proprietor: Anil)</span>
                        </span>
                        <span className="font-serif font-bold text-blue-700">₹{beverageSubtotal}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Indian GST Breakdown */}
                <div className="flex justify-between text-slate-500">
                  <span>CGST (2.5%)</span>
                  <span className="font-serif font-medium">₹{cgst}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (2.5%)</span>
                  <span className="font-serif font-medium">₹{sgst}</span>
                </div>

                {packagingFee > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Eco-friendly Packaging</span>
                    <span className="font-serif font-medium">₹{packagingFee}</span>
                  </div>
                )}

                {deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Direct Delivery Charge</span>
                    <span className="font-serif font-medium">₹{deliveryFee}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Final Payable Amount</span>
                  <span className="font-serif text-2xl font-black text-blue-700">₹{finalAmount}</span>
                </div>
              </div>

              {/* Table details for dine in */}
              {isDineInActive && tableNumber && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Dine-In Destination:</span>
                    <span className="text-blue-700 font-bold">Table {tableNumber}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {outletName || "PUBLIQ HARAGADDE"} • {diningArea || "Grand Dining Hall"}
                  </p>
                </div>
              )}

              {/* Proceed Button */}
              <a
                href="/checkout"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 hover:shadow-lg transition-all"
              >
                <span>Proceed to Split Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Dual PhonePe QR Settlements (Anil Bar + Ramesh Food)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
