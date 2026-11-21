"use client";

import React from "react";
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, 
  Sparkles, ShieldCheck, ArrowLeft, UtensilsCrossed 
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useTableSession } from "../../context/TableSessionContext";

export default function CartPage() {
  const { 
    items, itemCount, subtotal, cgst, sgst, totalTax, 
    packagingFee, deliveryFee, finalAmount, updateItemQuantity, 
    removeItem, clearCart, isLoading 
  } = useCart();
  const { tableNumber, diningArea, isDineInActive, outletName } = useTableSession();

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#070B12]">
        <div className="max-w-md w-full bg-[#0A111F] rounded-3xl p-8 text-center space-y-6 border border-[#D4AF37]/30 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#0F1626] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
              Your Order is Empty
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
              Explore our sizzling tandoori kebabs, rich butter chicken, flavorful biryanis, and refreshing craft cocktails.
            </p>
          </div>
          <a
            href="/menu"
            className="inline-flex items-center gap-2 py-3.5 px-8 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] font-bold text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg shadow-[#D4AF37]/20"
          >
            <span>Explore Menu &amp; Add Items</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 py-10 sm:py-14 bg-cover bg-fixed" style={{ backgroundImage: "linear-gradient(to bottom, rgba(7,11,18,0.97), rgba(7,11,18,0.95)), url('/images/publiq/backgrounds/bg-menu.webp')" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#D4AF37]/20 mb-8">
          <div className="flex items-center gap-3">
            <a href="/menu" className="p-2.5 rounded-full bg-[#0A111F] hover:bg-[#0F1626] border border-[#D4AF37]/30 text-[#D4AF37] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                Your Order ({itemCount} {itemCount === 1 ? "item" : "items"})
              </h1>
              {isDineInActive && tableNumber ? (
                <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dine-In • Table {tableNumber} ({diningArea || "Grand Dining Hall"})</span>
                </div>
              ) : (
                <p className="text-xs text-slate-300 mt-1 font-medium">
                  Review your selected food and drinks, then proceed to checkout.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline transition-colors"
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
                className="bg-[#0A111F] rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/20 shadow-xl flex gap-4"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#070B12] border border-[#D4AF37]/20 shrink-0">
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
                      <h3 className="font-serif text-base font-normal text-white">
                        {item.item_name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.variant_name && (
                      <span className="text-[11px] font-semibold text-[#D4AF37] block mt-0.5">
                        Portion: {item.variant_name}
                      </span>
                    )}

                    {item.selected_addons && item.selected_addons.length > 0 && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        + {item.selected_addons.map((a) => `${a.name} (₹${a.price})`).join(", ")}
                      </div>
                    )}

                    {item.special_request && (
                      <p className="text-[11px] text-[#D4AF37] bg-[#0F1626] border border-[#D4AF37]/30 rounded-md px-2 py-0.5 mt-1.5 inline-block">
                        Note: {item.special_request}
                      </p>
                    )}
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#D4AF37]/10">
                    <div className="flex items-center border border-[#D4AF37]/30 rounded-lg bg-[#070B12]">
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-serif text-base font-bold text-[#D4AF37]">
                      ₹{item.total_price}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <a
              href="/menu"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#D4AF37] hover:underline pt-2 tracking-wide"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add more culinary dishes or craft beverages</span>
            </a>
          </div>

          {/* Bill Summary */}
          <div className="lg:col-span-5">
            <div className="bg-[#0A111F] rounded-3xl p-6 border border-[#D4AF37]/25 shadow-2xl space-y-5 sticky top-28">
              <h2 className="font-serif text-xl font-normal text-white pb-3 border-b border-[#D4AF37]/15">
                Financial Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Item Subtotal</span>
                  <span className="font-serif font-bold text-white">₹{subtotal}</span>
                </div>
                
                {/* Indian GST Breakdown */}
                <div className="flex justify-between text-slate-400">
                  <span>CGST (2.5%)</span>
                  <span className="font-serif">₹{cgst}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SGST (2.5%)</span>
                  <span className="font-serif">₹{sgst}</span>
                </div>

                {packagingFee > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Eco-friendly Packaging</span>
                    <span className="font-serif">₹{packagingFee}</span>
                  </div>
                )}

                {deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Direct Delivery Charge</span>
                    <span className="font-serif">₹{deliveryFee}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#D4AF37]/20 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Final Payable Amount</span>
                  <span className="font-serif text-2xl font-bold text-[#D4AF37]">₹{finalAmount}</span>
                </div>
              </div>

              {/* Table details for dine in */}
              {isDineInActive && tableNumber && (
                <div className="p-3 bg-[#070B12] rounded-xl border border-[#D4AF37]/20 text-xs space-y-1">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>Dine-In Destination:</span>
                    <span className="text-[#D4AF37] font-bold">Table {tableNumber}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {outletName || "PUBLIQ HARAGADDE"} • {diningArea || "Grand Dining Hall"}
                  </p>
                </div>
              )}

              {/* Proceed Button */}
              <a
                href="/checkout"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] hover:opacity-95 text-[#070B12] font-bold text-xs tracking-widest uppercase transition-all shadow-xl shadow-[#D4AF37]/15 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Secure Server-Side GST Calculation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
