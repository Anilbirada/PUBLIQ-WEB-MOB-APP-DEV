"use client";

import React, { useState } from "react";
import { X, Clock, Flame, ShieldAlert, Plus, Minus, Check } from "lucide-react";
import { useCart } from "../context/CartContext";

export interface ProductDetailModalProps {
  product: any;
  isOpen?: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen = true, onClose }) => {
  if (isOpen === false || !product) return null;
  const { addItem, isLoading } = useCart();
  
  // Initial variant: default or first
  const defaultVariant = product.variants?.find((v: any) => v.is_default) || product.variants?.[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(defaultVariant?.id);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [specialRequest, setSpecialRequest] = useState<string>("");
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  // Calculate live item price
  let currentUnitPrice = product.base_price;
  if (selectedVariantId && product.variants) {
    const v = product.variants.find((v: any) => v.id === selectedVariantId);
    if (v) currentUnitPrice += v.price_delta;
  }
  if (selectedAddonIds.length > 0 && product.addons) {
    product.addons.forEach((ad: any) => {
      if (selectedAddonIds.includes(ad.id)) {
        currentUnitPrice += ad.price;
      }
    });
  }
  const currentTotal = round2(currentUnitPrice * quantity);

  function round2(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = async () => {
    await addItem({
      item_id: product.id,
      variant_id: selectedVariantId,
      quantity,
      selected_addon_ids: selectedAddonIds,
      special_request: specialRequest.trim() || undefined,
    });
    setAddedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 border border-slate-200 shadow-md transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Header */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-100 shrink-0">
          <img
            src={product.image_url || "/images/publiq/food_signature.webp"}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/images/publiq/food_signature.webp";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
          
          {/* Tags */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {product.is_veg ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white/95 px-2.5 py-0.5 rounded border border-emerald-300 backdrop-blur-sm shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  PURE VEG
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-white/95 px-2.5 py-0.5 rounded border border-rose-300 backdrop-blur-sm shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  NON-VEG
                </span>
              )}
              {product.is_alcohol && (
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded border border-amber-300 backdrop-blur-sm shadow-xs">
                  21+ RESERVE SPIRIT
                </span>
              )}
              {product.is_signature && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 rounded shadow-xs">
                  <Flame className="w-3 h-3 text-white" />
                  SIGNATURE
                </span>
              )}
            </div>
            {product.preparation_time_minutes > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-white/95 px-2.5 py-0.5 rounded border border-slate-200 shadow-xs">
                <Clock className="w-3 h-3 text-blue-600" />
                {product.preparation_time_minutes} mins
              </span>
            )}
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 leading-tight">
              {product.name}
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {product.description || "Crafted fresh with masterclass culinary craftsmanship and authentic ingredients."}
            </p>
          </div>

          {/* Variants / Serving Sizes */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-900 block mb-2">
                Choose Portion / Serving Size
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {product.variants.map((v: any) => {
                  const isSelected = selectedVariantId === v.id;
                  const priceText = v.price_delta > 0 ? `(+₹${v.price_delta})` : "";
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`py-2.5 px-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-600"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="text-blue-600 font-bold">{priceText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {product.addons && product.addons.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-900 block mb-2">
                Enhance with Artisanal Add-ons
              </label>
              <div className="space-y-2">
                {product.addons.map((ad: any) => {
                  const isChecked = selectedAddonIds.includes(ad.id);
                  return (
                    <div
                      key={ad.id}
                      onClick={() => toggleAddon(ad.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "border-blue-600 bg-blue-50 text-slate-900 font-semibold"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-400 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{ad.name}</span>
                      </div>
                      <span className="font-bold text-blue-600">+₹{ad.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Allergens warning */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Allergen Notice: Contains {product.allergens.map((a: any) => a.allergen_name).join(", ")}.
              </span>
            </div>
          )}

          {/* Special Cooking Instructions */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-700 block mb-1.5">
              Special Culinary Instructions (Optional)
            </label>
            <input
              type="text"
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="e.g. Mild spice, dressing separate, extra crisp..."
              className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity selector */}
          <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2.5 text-slate-700 hover:text-blue-600 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-2.5 text-slate-700 hover:text-blue-600 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Order Button */}
          <button
            type="button"
            disabled={isLoading || addedSuccess}
            onClick={handleAddToCart}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-between ${
              addedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            }`}
          >
            <span>{addedSuccess ? "Added to Order!" : "Add to Order"}</span>
            <span className="font-serif text-sm font-bold">₹{currentTotal}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
