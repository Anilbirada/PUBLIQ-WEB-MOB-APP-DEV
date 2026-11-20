"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, Smartphone, Banknote, ShieldCheck, 
  Sparkles, CheckCircle2, AlertCircle, ArrowLeft 
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useTableSession } from "../../context/TableSessionContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { 
    sessionId, items, itemCount, subtotal, cgst, sgst, 
    packagingFee, deliveryFee, finalAmount, clearCart 
  } = useCart();
  const { tableNumber, outletId, outletName, isDineInActive, sessionToken } = useTableSession();
  const { user, ensureGuestSession } = useAuth();

  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "COUNTER_BILLING">("UPI");
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const hasAlcohol = items.some((i) => i.is_alcohol);

  useEffect(() => {
    if (user) {
      if (user.fullName && user.fullName !== "Guest Diner") setCustomerName(user.fullName);
      if (user.phone && !user.phone.startsWith("guest_")) setCustomerPhone(user.phone);
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#070B12]">
        <div className="text-center space-y-4">
          <p className="text-slate-400">Your order summary is empty.</p>
          <a href="/menu" className="text-sm font-bold text-[#D4AF37] underline">
            Return to Digital Menu
          </a>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (hasAlcohol && !ageConfirmed) {
      setErrorMessage("Please confirm that you are at least 21 years old to order alcoholic beverages.");
      return;
    }

    if (!customerName || customerName.trim().length < 2) {
      setErrorMessage("Please provide your full Name to place your order.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage("Please provide a valid 10-digit Mobile Number. Live kitchen order tracking and digital bill will be sent to this number.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure session exists
      await ensureGuestSession();

      // Submit Order to backend (which recalculates all financials in DB transaction)
      const orderPayload = {
        session_id: sessionId,
        outlet_id: outletId || "default-outlet",
        dining_channel: isDineInActive ? "DINE_IN" : "TAKEAWAY",
        table_number: isDineInActive ? tableNumber : null,
        qr_session_id: sessionToken || null,
        customer_name: customerName.trim(),
        customer_phone: `+91${cleanPhone}`,
        delivery_address: deliveryAddress.trim() || null,
        special_instructions: specialInstructions.trim() || null,
        payment_method: paymentMethod,
        age_verified: ageConfirmed,
      };

      const order = await api.createOrder(orderPayload);

      // If paying online (UPI or Card), initiate payment intent
      if (paymentMethod === "UPI" || paymentMethod === "CARD") {
        const payInit = await api.initiatePayment(order.id, paymentMethod);
        // Automatically verify payment in simulator mode
        await api.verifyPayment(payInit.payment_id, payInit.transaction_ref, true);
      }

      // Route to Order Confirmation
      router.push(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 py-10 sm:py-14 bg-cover bg-fixed" style={{ backgroundImage: "linear-gradient(to bottom, rgba(7,11,18,0.97), rgba(7,11,18,0.95)), url('/images/publiq/backgrounds/bg-menu.webp')" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <a href="/cart" className="p-2.5 rounded-full bg-[#0A111F] hover:bg-[#0F1626] border border-[#D4AF37]/30 text-[#D4AF37] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-white">
              Confirm Your Order
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isDineInActive ? `Dine-In • Table ${tableNumber}` : "Online Order Checkout"}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-6">
          {/* 1. Dining Channel / Table Confirmation */}
          <div className="bg-[#0A111F] rounded-3xl p-6 border border-[#D4AF37]/20 shadow-xl space-y-4">
            <h2 className="font-serif text-lg font-normal text-white flex items-center justify-between">
              <span>Dining Destination</span>
              {isDineInActive && (
                <span className="text-xs font-bold text-[#D4AF37] bg-[#0F1626] px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
                  Dine-In Active
                </span>
              )}
            </h2>

            {isDineInActive ? (
              <div className="p-4 rounded-2xl bg-[#070B12] border border-[#D4AF37]/25 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block">
                    {outletName || "PUBLIQ Bar & Restaurant"}
                  </span>
                  <span className="font-serif text-xl font-normal text-white">
                    Table {tableNumber}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  Culinary creations delivered <br /> directly to your table
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Contact Phone Number (For updates)
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Customer Name & Special Requests */}
          <div className="bg-[#0A111F] rounded-3xl p-6 border border-[#D4AF37]/20 shadow-xl space-y-4 text-xs">
            <h2 className="font-serif text-lg font-normal text-white">
              Guest Details & Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Guest Full Name <span className="text-[#D4AF37] font-bold">* (Required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Mobile Phone Number <span className="text-[#D4AF37] font-bold">* (10 Digits Required)</span>
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3.5 rounded-xl border border-[#D4AF37]/25 bg-[#070B12] text-[#D4AF37] font-bold text-xs">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  ⚡ Live KOT tracking & GST tax invoice will be sent to this number.
                </p>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1.5">
                Special Culinary Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any dietary preferences or serving notes for the kitchen..."
                rows={2}
                className="w-full p-3 rounded-xl bg-[#070B12] border border-[#D4AF37]/25 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Alcohol Compliance Disclaimer */}
            {hasAlcohol && (
              <div className="p-4 rounded-2xl bg-[#0F1626] border border-amber-500/30 text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#D4AF37]">
                  <span>Legal Drinking Age Verification (21+)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your order contains alcoholic beverages. In compliance with the Karnataka / Telangana Excise Act, alcoholic beverages may only be ordered by and served to adults aged 21 years and older. Physical government ID verification may be requested by floor staff.
                </p>
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                  />
                  <span className="font-bold text-xs text-white">
                    I confirm that I am 21 years of age or older.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* 3. Payment Method Selection */}
          <div className="bg-[#0A111F] rounded-3xl p-6 border border-[#D4AF37]/20 shadow-xl space-y-4">
            <h2 className="font-serif text-lg font-normal text-white">
              Select Payment Method
            </h2>

            <div className="space-y-3">
              {/* Instant UPI */}
              <label
                onClick={() => setPaymentMethod("UPI")}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "UPI"
                    ? "border-[#D4AF37] bg-[#0F1626] ring-1 ring-[#D4AF37]"
                    : "border-[#D4AF37]/20 bg-[#070B12] hover:border-[#D4AF37]/40"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      UPI Instant Pay (GPay, PhonePe, Paytm, BHIM)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Fast zero-contact digital payment with instant receipt
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "UPI"}
                  onChange={() => setPaymentMethod("UPI")}
                  className="text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                />
              </label>

              {/* Debit/Credit Card */}
              <label
                onClick={() => setPaymentMethod("CARD")}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "CARD"
                    ? "border-[#D4AF37] bg-[#0F1626] ring-1 ring-[#D4AF37]"
                    : "border-[#D4AF37]/20 bg-[#070B12] hover:border-[#D4AF37]/40"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      Credit / Debit Card
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Visa, MasterCard, RuPay, Amex
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "CARD"}
                  onChange={() => setPaymentMethod("CARD")}
                  className="text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                />
              </label>

              {/* Pay at Counter / Staff billing */}
              <label
                onClick={() => setPaymentMethod("COUNTER_BILLING")}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "COUNTER_BILLING"
                    ? "border-[#D4AF37] bg-[#0F1626] ring-1 ring-[#D4AF37]"
                    : "border-[#D4AF37]/20 bg-[#070B12] hover:border-[#D4AF37]/40"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      Pay at Counter / Table Staff Billing
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Settle your bill after enjoying your culinary experience
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COUNTER_BILLING"}
                  onChange={() => setPaymentMethod("COUNTER_BILLING")}
                  className="text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                />
              </label>
            </div>
          </div>

          {/* 4. Final Review & Submit Button */}
          <div className="bg-[#0A111F] text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-[#D4AF37]/30">
            <div className="flex items-baseline justify-between border-b border-[#D4AF37]/20 pb-4">
              <div>
                <span className="text-xs text-[#D4AF37] uppercase tracking-widest block font-semibold">
                  Total Payable Amount
                </span>
                <span className="text-[11px] text-slate-400">
                  Includes 5% GST (2.5% CGST + 2.5% SGST)
                </span>
              </div>
              <span className="font-serif text-3xl font-bold text-[#D4AF37]">
                ₹{finalAmount}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] hover:opacity-95 text-[#070B12] font-bold text-xs tracking-widest uppercase transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting Order to Kitchen...</span>
              ) : (
                <span>Confirm & Place Order →</span>
              )}
            </button>

            <div className="text-center text-[11px] text-slate-400">
              Orders are immediately transmitted to the PUBLIQ kitchen display and POS terminal.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
