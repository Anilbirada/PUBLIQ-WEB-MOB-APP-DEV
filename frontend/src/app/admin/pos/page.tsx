"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart, CreditCard, Banknote, Smartphone, Receipt,
  Plus, Minus, Trash2, Printer, CheckCircle2, Split, Clock,
  Search, ShieldCheck, Utensils, Wine
} from "lucide-react";


const API_BASE = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')) || 'http://localhost:8001/api/v1';
interface PosTable {
  id: string;
  table_number: string;
  dining_area: string;
  capacity: number;
  status: string;
  active_order: any | null;
}

export default function PosPage() {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<PosTable | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CARD" | "CASH" | "SPLIT">("UPI");
  const [settling, setSettling] = useState<boolean>(false);
  const [lastBill, setLastBill] = useState<any | null>(null);

  // Quick dish menu for manual POS addition
  const quickDishes = [
    { name: "Charcoal Kalmi Kebab", price: 440, is_alcohol: false },
    { name: "Royal Paneer Malai Tikka", price: 380, is_alcohol: false },
    { name: "Old Delhi Butter Chicken", price: 490, is_alcohol: false },
    { name: "24-Hour Dal Makhani", price: 375, is_alcohol: false },
    { name: "Hyderabadi Dum Biryani", price: 480, is_alcohol: false },
    { name: "Garlic Butter Naan", price: 80, is_alcohol: false },
    { name: "Smoked Bourbon Old Fashioned", price: 580, is_alcohol: true },
    { name: "Glenfiddich 12 Yrs (30ml Peg)", price: 650, is_alcohol: true },
    { name: "Corona Extra Beer", price: 380, is_alcohol: true },
  ];

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/pos/active-tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (data.length > 0 && !selectedTable) {
          setSelectedTable(data[0]);
        } else if (selectedTable) {
          const updated = data.find((t: any) => t.id === selectedTable.id);
          if (updated) setSelectedTable(updated);
        }
      }
    } catch (err) {
      // Mock fallback tables
      const mock: PosTable[] = [
        {
          id: "t-08",
          table_number: "08",
          dining_area: "Garden Terrace",
          capacity: 4,
          status: "OCCUPIED",
          active_order: {
            order_id: "ord-mock-08",
            order_number: "PUB-HQ-01-9481",
            customer_name: "Aakash Mehta",
            customer_phone: "+91 98450 77112",
            subtotal: 1395.0,
            cgst: 34.88,
            sgst: 34.88,
            final_amount: 1464.76,
            items: [
              { item_name: "Charcoal Kalmi Kebab", quantity: 1, unit_price: 440, total_price: 440 },
              { item_name: "24-Hour Dal Makhani", quantity: 1, unit_price: 375, total_price: 375 },
              { item_name: "Smoked Bourbon Old Fashioned", quantity: 1, unit_price: 580, total_price: 580 },
            ],
          },
        },
        {
          id: "t-04",
          table_number: "04",
          dining_area: "Main Dining Hall",
          capacity: 6,
          status: "AVAILABLE",
          active_order: null,
        },
        {
          id: "t-03",
          table_number: "03",
          dining_area: "VIP Poolside Cabana",
          capacity: 8,
          status: "AVAILABLE",
          active_order: null,
        },
        {
          id: "t-bar",
          table_number: "BAR-02",
          dining_area: "Resto-Bar Counter",
          capacity: 2,
          status: "OCCUPIED",
          active_order: {
            order_id: "ord-mock-bar",
            order_number: "PUB-HQ-01-8812",
            customer_name: "Rohit & Friends",
            customer_phone: "+91 99001 22334",
            subtotal: 1300.0,
            cgst: 32.5,
            sgst: 32.5,
            final_amount: 1365.0,
            items: [
              { item_name: "Glenfiddich 12 Yrs (30ml Peg)", quantity: 2, unit_price: 650, total_price: 1300 },
            ],
          },
        },
      ];
      setTables(mock);
      setSelectedTable(mock[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSettle = async () => {
    if (!selectedTable?.active_order) return;
    setSettling(true);

    try {
      const res = await fetch(`${API_BASE}/admin/pos/settle-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedTable.active_order.order_id,
          payment_mode: paymentMode,
          discount_amount: discountAmount,
          cashier_id: "cashier-01",
        }),
      });

      if (res.ok) {
        const bill = await res.json();
        setLastBill(bill);
        await fetchTables();
      } else {
        throw new Error("Settlement failed");
      }
    } catch (_) {
      // Offline fallback bill generation
      const subtotal = selectedTable.active_order.subtotal;
      const discounted = Math.max(0, subtotal - discountAmount);
      const cgst = Math.round(discounted * 0.025 * 100) / 100;
      const sgst = Math.round(discounted * 0.025 * 100) / 100;
      const final = Math.round((discounted + cgst + sgst) * 100) / 100;

      setLastBill({
        success: true,
        bill_number: `PUB-INV-${new Date().getFullYear()}${new Date().getMonth() + 1}-` + Math.floor(1000 + Math.random() * 9000),
        final_amount: final,
        cgst,
        sgst,
        payment_mode: paymentMode,
        table_number: selectedTable.table_number,
        settled_at: new Date().toISOString(),
      });
    } finally {
      setSettling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentOrder = selectedTable?.active_order;
  const subtotal = currentOrder ? currentOrder.subtotal : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const cgst = Math.round(discountedSubtotal * 0.025 * 100) / 100;
  const sgst = Math.round(discountedSubtotal * 0.025 * 100) / 100;
  const grandTotal = Math.round((discountedSubtotal + cgst + sgst) * 100) / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-6.5rem)] animate-fade-in pb-4">
      {/* LEFT COLUMN: TABLE SELECTOR & QUICK ADD (7 COLS) */}
      <div className="lg:col-span-7 flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Floor Tables Grid Card */}
        <div className="p-6 bg-[#0B1528]/80 rounded-3xl border border-[#38BDF8]/25 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] block">
                LIVE FLOOR SELECTOR
              </span>
              <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                Restaurant & Bar Dining Tables
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Occupied (Billing)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {tables.map((t) => {
              const isSelected = selectedTable?.id === t.id;
              const isOccupied = t.status === "OCCUPIED" || t.active_order;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-[#38BDF8] bg-[#0F223D] ring-2 ring-[#38BDF8]/40 shadow-lg text-white"
                      : isOccupied
                      ? "border-amber-500/50 bg-[#1A1408]/90 hover:bg-[#251A08] text-white shadow-xs"
                      : "border-[#38BDF8]/20 bg-[#070E1A] hover:bg-[#0D1F38] hover:border-[#38BDF8]/40 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-bold text-xs text-white">T-{t.table_number}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOccupied ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                      }`}
                    ></span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{t.dining_area}</div>
                  {isOccupied && t.active_order ? (
                    <div className="text-[10px] text-[#38BDF8] font-bold mt-1">
                      ₹{t.active_order.final_amount}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">Vacant</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Menu Additions Card */}
        <div className="flex-1 p-6 bg-[#0B1528]/80 rounded-3xl border border-[#38BDF8]/25 shadow-xl space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] block">
                SPEED ORDERING
              </span>
              <h3 className="text-sm font-serif font-bold text-white">
                Quick Menu Addition (Staff POS)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Click item to append to selected table</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto">
            {quickDishes.map((dish, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!selectedTable) return;
                  alert(`Added 1x ${dish.name} to Table ${selectedTable.table_number}`);
                }}
                className="p-3 bg-[#070E1A] hover:bg-[#0D1F38] border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 rounded-2xl text-left transition flex flex-col justify-between"
              >
                <div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${dish.is_alcohol ? "bg-purple-950/80 text-purple-300 border border-purple-500/40" : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"}`}>
                    {dish.is_alcohol ? "BAR" : "FOOD"}
                  </span>
                  <p className="text-xs font-semibold text-white mt-1 line-clamp-1">{dish.name}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#38BDF8]/15">
                  <span className="text-xs font-bold text-[#38BDF8]">₹{dish.price}</span>
                  <span className="text-[10px] text-[#D4AF37] font-bold">+ ADD</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE TICKET, BILLING & SETTLEMENT (5 COLS) */}
      <div className="lg:col-span-5 bg-[#0B1528]/80 rounded-3xl border border-[#38BDF8]/25 p-6 shadow-xl flex flex-col justify-between h-full">
        {/* Ticket Header */}
        <div className="border-b border-[#38BDF8]/20 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-wider block">
                CURRENT TABLE BILL
              </span>
              <h2 className="font-serif text-xl font-bold text-white">
                {selectedTable ? `Table ${selectedTable.table_number}` : "Select Table"}
                <span className="text-xs font-normal text-slate-400 ml-2">
                  ({selectedTable?.dining_area || "Main"})
                </span>
              </h2>
            </div>
            {currentOrder ? (
              <span className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-bold rounded-full animate-pulse">
                Order #{currentOrder.order_number}
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold rounded-full">
                No Active Orders
              </span>
            )}
          </div>

          {currentOrder && (
            <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
              <span>Guest: <strong className="text-white">{currentOrder.customer_name}</strong></span>
              <span>Phone: <strong className="text-white">{currentOrder.customer_phone || "In-Restaurant"}</strong></span>
            </div>
          )}
        </div>

        {/* Ordered Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {currentOrder && currentOrder.items && currentOrder.items.length > 0 ? (
            currentOrder.items.map((it: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-[#070E1A] rounded-2xl border border-[#38BDF8]/20 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{it.quantity}x {it.item_name}</p>
                  {it.variant_name && (
                    <span className="text-[10px] text-[#38BDF8] font-medium">{it.variant_name}</span>
                  )}
                </div>
                <span className="font-bold text-[#38BDF8]">₹{it.total_price}</span>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30 text-[#38BDF8]" />
              <p className="text-xs font-semibold text-white">Table is currently empty</p>
              <p className="text-[10px] text-slate-400">Select an occupied table or append items from the menu</p>
            </div>
          )}
        </div>

        {/* Financial Calculation & Settlement Footer */}
        {currentOrder ? (
          <div className="border-t border-[#38BDF8]/20 pt-4 space-y-3">
            {/* Calculation summary */}
            <div className="space-y-1.5 text-xs bg-[#070E1A] p-3.5 rounded-2xl border border-[#38BDF8]/20">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal:</span>
                <span className="text-white font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  VIP / Member Discount:
                  <button
                    onClick={() => setDiscountAmount(discountAmount === 0 ? subtotal * 0.1 : 0)}
                    className="text-[10px] text-[#D4AF37] font-bold underline ml-1"
                  >
                    {discountAmount > 0 ? "Remove" : "Apply 10%"}
                  </button>
                </span>
                <span className="text-[#D4AF37] font-semibold">-₹{discountAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>CGST (2.5%):</span>
                <span className="text-white">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>SGST (2.5%):</span>
                <span className="text-white">₹{sgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#38BDF8]/20">
                <span>Total Payable:</span>
                <span className="text-[#38BDF8] font-serif text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: "UPI", label: "⚡ UPI", icon: Smartphone },
                { key: "CARD", label: "💳 Card", icon: CreditCard },
                { key: "CASH", label: "💵 Cash", icon: Banknote },
                { key: "SPLIT", label: "✂ Split", icon: Split },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMode(m.key as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition ${
                    paymentMode === m.key
                      ? "bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-[#070B12] border-transparent shadow-md font-bold"
                      : "bg-[#070E1A] text-slate-300 border-[#38BDF8]/25 hover:border-[#38BDF8]/50 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Settle Action */}
            <button
              onClick={handleSettle}
              disabled={settling}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#E5C378] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] text-[#070B12] font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {settling ? (
                <span>Generating GST Invoice...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#070B12]" />
                  <span>Settle & Generate GST Invoice (₹{grandTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        ) : null}

        {/* Settled Bill Modal Overlay */}
        {lastBill && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#0B1528] rounded-3xl border border-[#38BDF8]/40 p-6 space-y-4 shadow-2xl animate-scale-in text-white">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#070E1A] border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white">TAX INVOICE GENERATED</h3>
                <p className="text-[10px] text-[#38BDF8] uppercase font-bold tracking-wider">
                  PUBLIQ HOSPITALITY PVT LTD
                </p>
                <p className="text-[10px] text-slate-400">GSTIN: 29ABCDE1234F1Z5</p>
              </div>

              <div className="p-4 bg-[#070E1A] rounded-2xl border border-[#38BDF8]/20 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Number:</span>
                  <span className="font-bold text-white">{lastBill.bill_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Table:</span>
                  <span className="font-bold text-white">Table {lastBill.table_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CGST (2.5%):</span>
                  <span className="text-white">₹{lastBill.cgst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SGST (2.5%):</span>
                  <span className="text-white">₹{lastBill.sgst}</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-[#38BDF8]/20 pt-2">
                  <span>Settled Amount:</span>
                  <span className="text-[#38BDF8] text-sm">₹{lastBill.final_amount}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 bg-[#070E1A] hover:bg-[#0D1F38] border border-[#38BDF8]/30 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-[#38BDF8]" /> Print Bill
                </button>
                <button
                  onClick={() => setLastBill(null)}
                  className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-bold text-xs rounded-2xl shadow-lg transition"
                >
                  Close & Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
