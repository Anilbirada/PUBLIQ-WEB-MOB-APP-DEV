"use client";

import React, { useState, useEffect } from "react";
import { 
  Truck, PlusCircle, Phone, Mail, FileText, 
  Search, CheckCircle2, Clock, ShieldCheck, ArrowRight, Sparkles
} from "lucide-react";


const API_BASE = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')) || 'http://localhost:8001/api/v1';
interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  gstin: string;
  category: string;
  payment_terms: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  order_date: string;
  expected_delivery: string;
  total_amount: number;
  status: string;
  items?: any[];
}

const FALLBACK_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name: "Fresh Catch Poultry & Meats",
    contact_person: "Mohd. Rafiq",
    phone: "+91 98101 22334",
    email: "orders@freshcatch.in",
    gstin: "07AAACF1234F1Z8",
    category: "Poultry & Seafood",
    payment_terms: "NET 15"
  },
  {
    id: "sup-2",
    name: "Mother Dairy & Artisanal Cheeses",
    contact_person: "Ramesh Aggarwal",
    phone: "+91 98101 44556",
    email: "commercial@motherdairy.com",
    gstin: "07AABCM5678G1Z2",
    category: "Dairy & Ghee",
    payment_terms: "NET 7"
  },
  {
    id: "sup-3",
    name: "Royal Grains & Spices Syndicate",
    contact_person: "Harpreet Singh",
    phone: "+91 98101 66778",
    email: "supplies@royalgrains.co.in",
    gstin: "07AABCR9012H1Z5",
    category: "Grains, Lentils & Spices",
    payment_terms: "NET 30"
  },
  {
    id: "sup-4",
    name: "Delhi State Liquor & Beverages Distributor",
    contact_person: "Govind Narang",
    phone: "+91 98101 88990",
    email: "excise@delhispirit.gov.in",
    gstin: "07AAACD3456J1Z1",
    category: "Alcohol & Single Malts",
    payment_terms: "PREPAID_EXCISE"
  },
  {
    id: "sup-5",
    name: "Urbani Truffles & Gourmet Imports",
    contact_person: "Claire Moreau",
    phone: "+91 98101 11223",
    email: "india@urbanigourmet.com",
    gstin: "07AACCU7890K1Z9",
    category: "Gourmet & Oils",
    payment_terms: "IMMEDIATE"
  }
];

const FALLBACK_POS: PurchaseOrder[] = [
  {
    id: "po-1",
    po_number: "PUB-PO-202611-001",
    supplier_name: "Fresh Catch Poultry & Meats",
    order_date: "2026-11-14",
    expected_delivery: "2026-11-15",
    total_amount: 14500,
    status: "RECEIVED"
  },
  {
    id: "po-2",
    po_number: "PUB-PO-202611-002",
    supplier_name: "Delhi State Liquor & Beverages Distributor",
    order_date: "2026-11-15",
    expected_delivery: "2026-11-17",
    total_amount: 88500,
    status: "ORDERED"
  },
  {
    id: "po-3",
    po_number: "PUB-PO-202611-003",
    supplier_name: "Mother Dairy & Artisanal Cheeses",
    order_date: "2026-11-16",
    expected_delivery: "2026-11-17",
    total_amount: 9200,
    status: "RECEIVED"
  }
];

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(FALLBACK_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(FALLBACK_POS);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"SUPPLIERS" | "PURCHASE_ORDERS">("SUPPLIERS");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supRes, poRes] = await Promise.all([
          fetch(`${API_BASE}/admin/inventory/suppliers`),
          fetch(`${API_BASE}/admin/inventory/purchase-orders`)
        ]);
        if (supRes.ok) {
          const supData = await supRes.json();
          if (supData && supData.length > 0) setSuppliers(supData);
        }
        if (poRes.ok) {
          const poData = await poRes.json();
          if (poData && poData.length > 0) setPurchaseOrders(poData);
        }
      } catch {
        // fallback
      }
    };
    loadData();
  }, []);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1528]/80 backdrop-blur-md border border-[#38BDF8]/25 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-[#38BDF8] font-bold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#D4AF37]" /> Supply Chain & Procurement Network
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Vendor Partnerships & Procurement
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Supplier verification, GSTIN tracking, credit terms, and purchase order workflow.
          </p>
        </div>

        <div className="flex bg-[#070E1A] p-1.5 rounded-2xl border border-[#38BDF8]/20">
          <button
            onClick={() => setActiveTab("SUPPLIERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "SUPPLIERS" 
                ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Verified Vendors ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("PURCHASE_ORDERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "PURCHASE_ORDERS" 
                ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>
      </div>

      {activeTab === "SUPPLIERS" ? (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search vendor name, category or GSTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#070E1A] border border-[#38BDF8]/20 text-white placeholder-slate-500 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <span className="text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Tax Compliant GSTIN Vendors
            </span>
          </div>

          {/* Supplier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSuppliers.map(sup => (
              <div key={sup.id} className="bg-[#0B1528]/80 border border-[#38BDF8]/25 hover:border-[#38BDF8]/60 rounded-3xl p-6 space-y-4 transition-all shadow-xl hover:shadow-2xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-white text-base">{sup.name}</h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#070E1A] border border-[#38BDF8]/20 text-[#38BDF8] text-[11px] mt-1 font-bold">
                      {sup.category}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#070E1A] text-slate-300 border border-[#38BDF8]/20">
                    {sup.payment_terms}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-[#38BDF8]/20">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Representative:</span>
                    <span className="text-white font-semibold">{sup.contact_person}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-[#38BDF8]" /> Phone:
                    </span>
                    <span className="text-white font-medium">{sup.phone}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> Email:
                    </span>
                    <span className="text-white font-medium truncate max-w-[180px]">{sup.email}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">GSTIN:</span>
                    <span className="font-mono text-[#38BDF8] font-bold text-[11px] bg-[#070E1A] px-2 py-0.5 rounded border border-[#38BDF8]/20">{sup.gstin}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Purchase Orders Table */
        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070E1A] text-slate-300 uppercase tracking-wider border-b border-[#38BDF8]/25">
                <tr>
                  <th className="py-3.5 px-5 font-bold">PO Number</th>
                  <th className="py-3.5 px-4 font-bold">Supplier</th>
                  <th className="py-3.5 px-4 font-bold text-center">Order Date</th>
                  <th className="py-3.5 px-4 font-bold text-center">Expected Delivery</th>
                  <th className="py-3.5 px-4 font-bold text-right">PO Total</th>
                  <th className="py-3.5 px-5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#38BDF8]/15">
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-[#0F223D]/50 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-[#38BDF8]">
                      {po.po_number}
                    </td>
                    <td className="py-4 px-4 font-serif font-bold text-white text-sm">
                      {po.supplier_name}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400 font-medium">
                      {po.order_date}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400 font-medium">
                      {po.expected_delivery}
                    </td>
                    <td className="py-4 px-4 text-right font-serif font-bold text-[#D4AF37] text-base">
                      ₹{po.total_amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                        po.status === "RECEIVED"
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                      }`}>
                        {po.status === "RECEIVED" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
