"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Clock, Flame, ShieldAlert, Plus, 
  Minus, Check, ShoppingBag, Wine 
} from "lucide-react";
import { api } from "../../../lib/api";
import { useCart } from "../../../context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const { addItem, itemCount, isLoading: cartLoading } = useCart();

  const [product, setProduct] = useState<any | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [specialRequest, setSpecialRequest] = useState<string>("");
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      try {
        const item = await api.getProduct(productId);
        setProduct(item);
        const defVariant = item.variants?.find((v: any) => v.is_default) || item.variants?.[0];
        if (defVariant) setSelectedVariantId(defVariant.id);
      } catch (err: any) {
        setError(err.message || "Product not found.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#070B12]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#070B12]">
        <div className="text-center space-y-3">
          <p className="text-sm text-rose-400">{error || "Product not found."}</p>
          <a href="/menu" className="text-xs font-bold text-[#D4AF37] underline">
            Return to Digital Menu
          </a>
        </div>
      </div>
    );
  }

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
  const currentTotal = Math.round((currentUnitPrice * quantity + Number.EPSILON) * 100) / 100;

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
      router.push("/cart");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 py-10 sm:py-14 selection:bg-[#D4AF37] selection:text-[#070B12]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#D4AF37] hover:text-[#E5C378] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>

        <div className="bg-[#0A111F] rounded-3xl overflow-hidden border border-[#D4AF37]/30 shadow-2xl">
          {/* Large Hero Image */}
          <div className="relative h-72 sm:h-96 w-full bg-[#070B12]">
            <img
              src={product.image_url || "/images/publiq/food_signature.webp"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A111F] via-[#0A111F]/30 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {product.is_veg ? (
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-xs font-bold px-3 py-1 rounded backdrop-blur-sm">
                    PURE VEG
                  </span>
                ) : (
                  <span className="bg-rose-950/80 text-rose-400 border border-rose-500/50 text-xs font-bold px-3 py-1 rounded backdrop-blur-sm">
                    NON-VEG
                  </span>
                )}
                {product.is_signature && (
                  <span className="bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] text-xs font-bold px-3 py-1 rounded flex items-center gap-1 shadow">
                    <Flame className="w-3.5 h-3.5" />
                    SIGNATURE
                  </span>
                )}
              </div>
              {product.preparation_time_minutes > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-300 bg-black/60 px-3 py-1 rounded backdrop-blur-sm border border-[#D4AF37]/20">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  ~{product.preparation_time_minutes} mins
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white">
                {product.name}
              </h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {product.description || "Artisanal preparation with fine spices and luxury ingredients."}
              </p>
            </div>

            {/* Portions */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
                  Serving Size / Portion
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`py-2.5 px-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                        selectedVariantId === v.id
                          ? "border-[#D4AF37] bg-[#0F1626] text-white font-bold ring-1 ring-[#D4AF37]"
                          : "border-[#D4AF37]/20 bg-[#070B12] text-slate-300 hover:border-[#D4AF37]/40"
                      }`}
                    >
                      <span>{v.name}</span>
                      {v.price_delta > 0 && <span className="text-[#D4AF37] font-bold">+₹{v.price_delta}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {product.addons && product.addons.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
                  Add-on Accompaniments
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
                            ? "border-[#D4AF37] bg-[#0F1626] text-white"
                            : "border-[#D4AF37]/20 bg-[#070B12] text-slate-300 hover:border-[#D4AF37]/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked ? "bg-[#D4AF37] border-[#D4AF37] text-[#070B12]" : "border-slate-600"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{ad.name}</span>
                        </div>
                        <span className="font-bold text-[#D4AF37]">+₹{ad.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special request */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Special Preparation Note (Optional)
              </label>
              <input
                type="text"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="e.g. Mild spice, extra lemon, crisp roti..."
                className="w-full text-xs p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Bottom Add Bar */}
            <div className="pt-6 border-t border-[#D4AF37]/15 flex items-center justify-between gap-4">
              <div className="flex items-center border border-[#D4AF37]/30 rounded-xl bg-[#070B12]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 text-slate-400 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-bold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-3 text-slate-400 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={cartLoading || addedSuccess}
                onClick={handleAddToCart}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#D4AF37]/15 flex items-center justify-between ${
                  addedSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] hover:opacity-95"
                }`}
              >
                <span>{addedSuccess ? "Added to Order!" : "Add to Order"}</span>
                <span className="font-serif text-lg font-bold">₹{currentTotal}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
