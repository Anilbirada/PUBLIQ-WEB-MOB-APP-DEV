"use client";

import React, { useState, useEffect } from "react";
import { 
  Receipt, Download, Printer, Search, Filter, RefreshCw, 
  CheckCircle2, Clock, UtensilsCrossed, Wine, ChevronDown, 
  ExternalLink, FileText, ArrowUpDown, AlertCircle, Sparkles
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { LiveClock } from "@/components/LiveClock";

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  order_id: string;
  department: "FOOD" | "BEVERAGE";
  owner_name: string;
  business_name: string;
  upi_id: string;
  table_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  waiter_name: string;
  subtotal: number;
  discount_pct: number;
  discount_amount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  grand_total: number;
  payment_status: "PAID" | "PENDING";
  payment_method: string | null;
  items_count: number;
  items: InvoiceItem[];
  created_at: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeModalInvoice, setActiveModalInvoice] = useState<InvoiceRecord | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentFilter !== "ALL") params.append("department", departmentFilter);
      if (statusFilter !== "ALL") params.append("payment_status", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const res = await fetch(`${API_BASE}/admin/management/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [departmentFilter, statusFilter]);

  // Handle print directly using the HTML template from the backend
  const handlePrintInvoice = async (invoiceNumber: string) => {
    setDownloadingId(invoiceNumber);
    try {
      const res = await fetch(`${API_BASE}/admin/management/invoices/${invoiceNumber}/download`);
      if (res.ok) {
        const data = await res.json();
        if (data.html_content) {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(data.html_content);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          }
        }
      }
    } catch (err) {
      console.error("Print error:", err);
    } finally {
      setDownloadingId(null);
      setOpenDropdownId(null);
    }
  };

  // Handle Download HTML/PDF
  const handleDownloadInvoice = async (invoiceNumber: string) => {
    setDownloadingId(invoiceNumber);
    try {
      const res = await fetch(`${API_BASE}/admin/management/invoices/${invoiceNumber}/download`);
      if (res.ok) {
        const data = await res.json();
        if (data.html_content) {
          const blob = new Blob([data.html_content], { type: "text/html;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${invoiceNumber}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloadingId(null);
      setOpenDropdownId(null);
    }
  };

  // Handle Download Both (Food + Beverage for this order)
  const handleDownloadBoth = async (orderId: string) => {
    if (!orderId) return;
    setDownloadingId(`both-${orderId}`);
    try {
      const res = await fetch(`${API_BASE}/admin/management/orders/${orderId}/invoices/download-both`);
      if (res.ok) {
        const data = await res.json();
        if (data.food_invoice) {
          await handleDownloadInvoice(data.food_invoice.invoice_number);
        }
        if (data.beverage_invoice) {
          await handleDownloadInvoice(data.beverage_invoice.invoice_number);
        }
      } else {
        alert("Dual invoices not found for this specific order.");
      }
    } catch (err) {
      console.error("Download both error:", err);
    } finally {
      setDownloadingId(null);
      setOpenDropdownId(null);
    }
  };

  // Calculations for summary banner
  const totalFoodRevenue = invoices
    .filter(i => i.department === "FOOD" && i.payment_status === "PAID")
    .reduce((sum, i) => sum + i.grand_total, 0);

  const totalBarRevenue = invoices
    .filter(i => i.department === "BEVERAGE" && i.payment_status === "PAID")
    .reduce((sum, i) => sum + i.grand_total, 0);

  const totalPaidCount = invoices.filter(i => i.payment_status === "PAID").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header & Summary Stats */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Tax Compliance &amp; Department Invoicing
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Billing &amp; Invoice Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Dual GST tax invoices with isolated settlement VPAs: Ramesh S P (Food) &amp; Anil (Beverage).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LiveClock variant="header" className="hidden sm:inline-flex" />
            <button
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await fetchInvoices();
                  setToastMsg("Tax invoices synced in real time");
                  setTimeout(() => setToastMsg(null), 2500);
                } finally {
                  setTimeout(() => setIsRefreshing(false), 600);
                }
              }}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-xs transition-colors ${
                isRefreshing ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-95"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 transition-transform ${isRefreshing || loading ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Total Invoices</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{invoices.length}</span>
              <span className="text-xs text-slate-500">records</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              {totalPaidCount} settled &amp; paid
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Food Revenue</span>
              <UtensilsCrossed className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalFoodRevenue.toFixed(2)}</div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">
              Ramesh S P • ramesh776059@ybl
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50/50 border border-cyan-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">Bar Revenue</span>
              <Wine className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalBarRevenue.toFixed(2)}</div>
            <span className="text-[11px] text-cyan-700 font-medium mt-1 block">
              Anil • 8431712924-3@ybl
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Settled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{(totalFoodRevenue + totalBarRevenue).toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
              5% GST Non-ITC Composition Mode
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number, table, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDepartmentFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                departmentFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Depts
            </button>
            <button
              onClick={() => setDepartmentFilter("FOOD")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                departmentFilter === "FOOD" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-amber-700"
              }`}
            >
              Food (Kitchen)
            </button>
            <button
              onClick={() => setDepartmentFilter("BEVERAGE")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                departmentFilter === "BEVERAGE" ? "bg-white text-cyan-700 shadow-xs" : "text-slate-600 hover:text-cyan-700"
              }`}
            >
              Bar (Drinks)
            </button>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "PAID" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "PENDING" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-rose-700"
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* 3. Invoices Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Table / Order</th>
                <th className="py-3.5 px-4">Department &amp; Payee</th>
                <th className="py-3.5 px-4">Customer &amp; Waiter</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Taxable</th>
                <th className="py-3.5 px-4 text-right">GST (5%)</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading billing and invoice records...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No invoice records found matching your filters.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isFood = inv.department === "FOOD";
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Invoice # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isFood ? "bg-amber-500" : "bg-cyan-500"}`} />
                          {inv.invoice_number}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block font-sans mt-0.5">
                          {inv.created_at}
                        </span>
                      </td>

                      {/* Table / Order */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">Table {inv.table_number || "Counter"}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {inv.order_id ? inv.order_id.slice(-6) : "N/A"}
                        </span>
                      </td>

                      {/* Department & Payee */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isFood
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-cyan-100 text-cyan-800 border border-cyan-200"
                          }`}
                        >
                          {isFood ? <UtensilsCrossed className="w-3 h-3" /> : <Wine className="w-3 h-3" />}
                          {inv.department}
                        </span>
                        <div className="text-[11px] font-bold text-slate-800 mt-1">{inv.owner_name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.upi_id}</span>
                      </td>

                      {/* Customer & Waiter */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {inv.customer_name || "Walk-in Guest"}
                        </div>
                        {inv.customer_phone && (
                          <div className="text-[11px] text-slate-400">{inv.customer_phone}</div>
                        )}
                        <span className="text-[10px] text-blue-700 font-medium block mt-0.5">
                          Waiter: {inv.waiter_name}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setActiveModalInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                        >
                          {inv.items_count} items &rarr;
                        </button>
                      </td>

                      {/* Taxable */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        ₹{inv.taxable_amount.toFixed(2)}
                      </td>

                      {/* GST */}
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        ₹{(inv.cgst + inv.sgst).toFixed(2)}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        ₹{inv.grand_total.toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.payment_status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {inv.payment_status === "PAID" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-rose-600" />
                          )}
                          {inv.payment_status}
                        </span>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handlePrintInvoice(inv.invoice_number)}
                            disabled={downloadingId === inv.invoice_number}
                            title="Print Invoice"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadInvoice(inv.invoice_number)}
                            disabled={downloadingId === inv.invoice_number}
                            title="Download HTML"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* More Options Dropdown Toggle */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === inv.id ? null : inv.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {openDropdownId === inv.id && (
                              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-left animate-fadeIn">
                                <button
                                  onClick={() => handlePrintInvoice(inv.invoice_number)}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Print {isFood ? "Food" : "Bar"} Invoice
                                </button>

                                <button
                                  onClick={() => handleDownloadInvoice(inv.invoice_number)}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download Individual ({inv.invoice_number})
                                </button>

                                {inv.order_id && (
                                  <button
                                    onClick={() => handleDownloadBoth(inv.order_id)}
                                    className="w-full px-3.5 py-2 text-xs text-indigo-700 font-semibold hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    Download Both (Food + Bar)
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Items Breakdown Modal */}
      {activeModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 font-mono">{activeModalInvoice.invoice_number}</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeModalInvoice.department} Invoice Breakdown
                </h3>
              </div>
              <button
                onClick={() => setActiveModalInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activeModalInvoice.items && activeModalInvoice.items.length > 0 ? (
                activeModalInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-[11px] text-slate-400 block">
                        ₹{item.price.toFixed(2)} &times; {item.qty}
                      </span>
                    </div>
                    <span className="font-black text-slate-900">₹{item.total.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-4">No itemized details stored.</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Grand Total (Incl. 5% GST):</span>
              <span className="text-base font-black text-slate-900">
                ₹{activeModalInvoice.grand_total.toFixed(2)}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  handlePrintInvoice(activeModalInvoice.invoice_number);
                  setActiveModalInvoice(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
              <button
                onClick={() => {
                  handleDownloadInvoice(activeModalInvoice.invoice_number);
                  setActiveModalInvoice(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
