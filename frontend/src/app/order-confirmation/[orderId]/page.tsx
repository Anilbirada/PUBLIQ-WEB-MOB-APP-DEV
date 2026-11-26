"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, Sparkles, Clock, ArrowRight, 
  MapPin, Utensils, Receipt, PhoneCall, Calendar
} from "lucide-react";
import { api } from "../../../lib/api";
import { LiveClock } from "@/components/LiveClock";

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        const data = await api.getOrder(orderId);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Unable to fetch order details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Retrieving your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-sm text-rose-600 font-medium">{error || "Order not found."}</p>
          <a href="/menu" className="text-xs font-bold text-blue-600 hover:text-blue-800 underline">
            Back to Digital Menu
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-10 sm:py-16 selection:bg-blue-600/20 selection:text-blue-900">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6 text-center">
          {/* Animated Success Badge */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">
              Order Confirmed &amp; Sent to Kitchen
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Thank You for Dining with Us!
            </h1>
            <p className="text-xs text-slate-600 mt-1.5 font-normal">
              Your order has been queued directly into the PUBLIQ kitchen &amp; bar display system.
            </p>
            <div className="mt-3 flex items-center justify-center">
              <LiveClock variant="badge" showSeconds={true} showDate={true} className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold shadow-xs" />
            </div>
          </div>

          {/* Key Reference Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-left text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Order Number:</span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {order.order_number}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Bill Generated Date &amp; Time:
              </span>
              <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {order.created_at
                  ? new Date(order.created_at).toLocaleString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })
                  : new Date().toLocaleString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Dining Location:</span>
              <span className="font-bold text-slate-900">
                {order.table_number ? `Dine-In • Table ${order.table_number}` : "Dine-In Table Service"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Estimated Prep Time:</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{order.estimated_prep_time_minutes} minutes
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold">Payment Status:</span>
              <span className="font-bold px-2.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                {order.payment_status} ({order.payment_method})
              </span>
            </div>
          </div>

          {/* Order Items Snapshot */}
          <div className="text-left space-y-2 border-t border-slate-100 pt-4">
            <span className="text-xs font-bold text-slate-800 block uppercase tracking-wider">Ordered Items:</span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-xs text-slate-700">
                  <span>
                    {item.quantity}x {item.item_name} {item.variant_name ? `(${item.variant_name})` : ""}
                  </span>
                  <span className="font-serif font-bold text-slate-900">₹{item.total_price}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Final Total Paid:</span>
              <span className="font-serif text-blue-700">₹{order.final_amount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href={`/track/${order.order_number}`}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Track Live Order Status</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="/menu"
              className="block text-xs font-bold text-blue-600 hover:underline"
            >
              Add more items to this order
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
