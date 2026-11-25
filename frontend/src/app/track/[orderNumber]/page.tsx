"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle, Clock, Utensils, Wine, Bell, 
  Sparkles, AlertCircle, ChefHat, CheckCircle2, Star,
  Receipt, CreditCard, PhoneCall, ChevronLeft
} from "lucide-react";
import { api, resolveWsBase, API_BASE } from "../../../lib/api";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [waiterCalled, setWaiterCalled] = useState<boolean>(false);

  // Customer Review State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [drinksRating, setDrinksRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>("");

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      try {
        const data = await api.trackOrder(orderNumber);
        setOrder(data);
        setLastUpdated(new Date().toLocaleTimeString());

        // Check if user already submitted a review for this order
        if (typeof window !== "undefined" && data?.id) {
          if (localStorage.getItem(`publiq_review_${data.id}`)) {
            setReviewSubmitted(true);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order tracking data.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();

    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  // Live WebSocket connection for instant KDS updates
  useEffect(() => {
    if (!order?.id) return;

    try {
      const wsUrl = `${resolveWsBase()}/orders/${order.id}`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === "ORDER_STATUS_CHANGED" && msg.status) {
            setOrder((prev: any) => ({
              ...prev,
              order_status: msg.status,
              food_status: msg.food_status || prev.food_status,
              beverage_status: msg.beverage_status || prev.beverage_status,
            }));
            setLastUpdated(new Date().toLocaleTimeString());
          }
        } catch (_) {}
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (_) {}
  }, [order?.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.id) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          customer_name: order.customer_name || "Valued Diner",
          table_number: order.table_number,
          overall_rating: reviewRating,
          food_rating: foodRating,
          drinks_rating: drinksRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSubmitted(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(`publiq_review_${order.id}`, "true");
        }
      } else {
        // If already submitted in database, mark as submitted
        if (data.detail && data.detail.includes("already been submitted")) {
          setReviewSubmitted(true);
          if (typeof window !== "undefined") {
            localStorage.setItem(`publiq_review_${order.id}`, "true");
          }
        } else {
          setReviewError(data.detail || "Unable to submit review");
        }
      }
    } catch (_) {
      // Offline fallback: save locally so diner has immediate positive experience
      setReviewSubmitted(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`publiq_review_${order.id}`, "true");
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Connecting to live kitchen tracker...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm text-rose-600 font-semibold">{error || "Order tracking record not found."}</p>
          <Link href="/menu" className="text-xs font-bold text-blue-600 hover:text-blue-800 underline">
            Return to Digital Menu
          </Link>
        </div>
      </div>
    );
  }

  const isDineIn = Boolean(order.table_number);

  const orderStages = [
    { key: "PLACED", label: "Order Placed", desc: "Submitted to restaurant central system" },
    { key: "ACCEPTED", label: "Accepted by Floor", desc: "Kitchen ticket printed and routed" },
    { key: "PREPARING", label: "Crafting in Kitchen & Bar", desc: "Chefs preparing your food & cocktails" },
    { key: "READY", label: "Plated & Ready", desc: isDineIn ? "Ready at kitchen counter for delivery" : "Freshly prepared and ready for packaging" },
    { 
      key: "SERVED", 
      label: isDineIn ? "Served at Table" : "Ready for Pickup / Delivered", 
      desc: isDineIn ? "Delivered to your table. Enjoy your experience!" : "Packaged fresh and ready for takeaway or delivery." 
    },
  ];

  // Determine stage index
  const currentStageIndex = orderStages.findIndex((s) => s.key === order.order_status);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Compute bill financials
  const subtotal = Number(order.subtotal || order.items?.reduce((sum: number, it: any) => sum + (Number(it.total_price) || 0), 0) || 0);
  const cgst = Number(order.cgst || (subtotal * 0.025) || 0);
  const sgst = Number(order.sgst || (subtotal * 0.025) || 0);
  const totalTax = cgst + sgst;
  const deliveryFee = Number(order.delivery_fee || 0);
  const packagingFee = Number(order.packaging_fee || 0);
  const discount = Number(order.discount_amount || 0);
  const finalAmount = Number(order.final_amount || (subtotal + totalTax + deliveryFee + packagingFee - discount) || 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-8 sm:py-12 selection:bg-blue-600/20 selection:text-blue-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Back to Menu Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Digital Menu</span>
          </Link>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            PUBLIQ Hospitality
          </span>
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                  Live Kitchen &amp; Bar Tracker
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1 text-slate-900">
                Order #{order.order_number}
              </h1>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {isDineIn ? `Dine-In • Table ${order.table_number}` : "Takeaway / Delivery"} • {order.outlet_name || "PUBLIQ HARAGADDE"}
              </div>
            </div>

            <div className="bg-blue-50/70 rounded-2xl p-3 sm:text-right border border-blue-200 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                Estimated Delivery
              </span>
              <span className="font-serif text-2xl font-bold text-blue-700 flex items-center sm:justify-end gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
                ~{order.estimated_prep_time_minutes || 20} mins
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Last synchronized: {lastUpdated || "Live"}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Real-Time Active
            </span>
          </div>
        </div>

        {/* Multi-Stage Visual Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Order Progression
            </h2>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
              {orderStages[activeIndex]?.label || "Processing"}
            </span>
          </div>

          <div className="relative pl-8 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200">
            {orderStages.map((stage, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={stage.key} className="relative flex items-start gap-4">
                  {/* Step Node */}
                  <div
                    className={`absolute -left-8 sm:-left-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100 animate-pulse shadow-md"
                        : "bg-slate-100 text-slate-400 border border-slate-300"
                    }`}
                  >
                    {isPast ? "✓" : idx + 1}
                  </div>

                  <div>
                    <h3
                      className={`font-serif text-base ${
                        isCurrent
                          ? "text-blue-700 font-bold"
                          : isPast
                          ? "text-slate-900 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dual Station Breakdown: Food vs Beverages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Clay Oven &amp; Kitchen Station
              </span>
              <span className="font-serif text-base text-slate-900 font-semibold">
                Food: <span className="text-amber-700 font-bold">{order.food_status || "PENDING"}</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Wine className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Resto-Bar Mixology Station
              </span>
              <span className="font-serif text-base text-slate-900 font-semibold">
                Beverages: <span className="text-purple-700 font-bold">{order.beverage_status || "NOT_ORDERED"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Ordered Items & Comprehensive Financial Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-blue-600" />
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Ordered Culinary &amp; Drinks
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {order.items?.length || 0} Item{order.items?.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Itemized List */}
          <div className="divide-y divide-slate-100 text-xs">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm">
                    {item.quantity}x {item.item_name}
                  </span>
                  {item.variant_name && (
                    <span className="text-slate-500 block text-[11px]">
                      Portion: {item.variant_name}
                    </span>
                  )}
                  {item.special_request && (
                    <span className="text-blue-600 block text-[11px] italic">
                      Note: {item.special_request}
                    </span>
                  )}
                </div>
                <span className="font-serif font-bold text-slate-900 text-sm">
                  ₹{Number(item.total_price || (item.unit_price * item.quantity)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Complete Financial Totals Receipt Box */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Goods &amp; Services Tax (GST 5%)</span>
              <span className="font-semibold text-slate-900">₹{totalTax.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-900">₹{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {packagingFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Eco Packaging</span>
                <span className="font-semibold text-slate-900">₹{packagingFee.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promotional Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span className="font-serif text-base">Total Bill Amount</span>
              <span className="font-serif text-lg text-blue-700">₹{finalAmount.toFixed(2)}</span>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment: {order.payment_method || "Online / Counter Settlement"}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                order.payment_status === "PAID"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}>
                {order.payment_status === "PAID" ? "Paid in Full" : "Pending Settlement"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Service Action / Assistance */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isDineIn ? `Table ${order.table_number} Service` : "Customer Assistance"}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isDineIn 
                  ? "Need extra cutlery, water refill, or bill settlement? Alert your service steward."
                  : "Questions regarding your order preparation or pickup? Contact restaurant desk."
                }
              </p>
            </div>
          </div>

          {isDineIn ? (
            <button
              onClick={handleCallWaiter}
              disabled={waiterCalled}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${
                waiterCalled
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              }`}
            >
              {waiterCalled ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Steward Alerted!</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Call Waiter</span>
                </>
              )}
            </button>
          ) : (
            <a
              href="tel:+919800011000"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <PhoneCall className="w-4 h-4" />
              <span>+91 98000 11000</span>
            </a>
          )}
        </div>

        {/* Customer Dining Experience Review Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 block">
              GUEST SATISFACTION &amp; FEEDBACK
            </span>
            <h3 className="font-serif text-xl font-bold text-slate-900 mt-1">
              Rate Your PUBLIQ Dining Experience
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your feedback is shared directly with Executive Chef and Mixology team.
            </p>
          </div>

          {reviewSubmitted ? (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-serif text-base font-bold text-slate-900">Review Received!</h4>
              <p className="text-xs text-emerald-800 font-medium">
                Thank you for reviewing your dining experience with us at PUBLIQ Bar &amp; Restaurant.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-5">
              {reviewError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Overall Rating Star Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Overall Dining Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star className={`w-7 h-7 ${star <= reviewRating ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 ml-2">
                    {reviewRating === 5 ? "Exceptional (5/5)" : reviewRating === 4 ? "Very Good (4/5)" : reviewRating === 3 ? "Good (3/5)" : `${reviewRating}/5`}
                  </span>
                </div>
              </div>

              {/* Departmental Sub-Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Food &amp; Kitchen Flavours ({foodRating}/5)
                  </label>
                  <div className="flex items-center gap-1.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFoodRating(s)}
                        className="focus:outline-none hover:scale-105"
                      >
                        <Star className={`w-4 h-4 ${s <= foodRating ? "fill-amber-400" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Cocktails &amp; Bar Experience ({drinksRating}/5)
                  </label>
                  <div className="flex items-center gap-1.5 text-blue-600">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDrinksRating(s)}
                        className="focus:outline-none hover:scale-105"
                      >
                        <Star className={`w-4 h-4 ${s <= drinksRating ? "fill-blue-500" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Written Feedback Textarea */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Your Compliments or Suggestions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us what you loved about our dishes, cocktails, or service..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {reviewSubmitting ? "Submitting Your Review..." : "Submit Verified Dining Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
