"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Smartphone, Utensils, QrCode, Clock, CheckCircle2, AlertTriangle, 
  Search, Plus, Minus, UserCheck, ShieldAlert, ArrowRight, X, RefreshCw,
  CreditCard, Banknote, Split, Send, Bell, Download, Camera, Scan,
  Receipt, FileText, Check, ChevronRight, Hash, Printer, Eye, LogOut
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { LiveClock } from "@/components/LiveClock";

export default function WaiterMobileApp() {
  const router = useRouter();
  const { logout } = useAuth();

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [waiter, setWaiter] = useState<any | null>(null);
  const [pin, setPin] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleExit = () => {
    setToken(null);
    logout();
    router.push("/login");
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "tables" | "scan" | "qr_orders" | "tracking" | "menu" | "billing">("dashboard");

  // Operational states
  const [metrics, setMetrics] = useState<any>({
    total_tables: 16,
    available_tables: 16,
    occupied_tables: 0,
    pending_approval: 0,
    preparing_orders: 0,
    ready_to_serve: 0,
    pending_bills: 0
  });

  const [tables, setTables] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [livePrepOrders, setLivePrepOrders] = useState<any[]>([]);
  const [pendingBillingTables, setPendingBillingTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [tableFilter, setTableFilter] = useState<"ALL" | "OCCUPIED" | "AVAILABLE" | "BILL_REQUESTED">("ALL");

  // Physical Table QR Scanner State
  const [scanInput, setScanInput] = useState<string>("");
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>("");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual POS State
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<{ [id: string]: { item: any; quantity: number } }>({});
  const [posTableNumber, setPosTableNumber] = useState<string>("01");

  // Billing & Invoice State
  const [billTableNum, setBillTableNum] = useState<string>("01");
  const [billPreview, setBillPreview] = useState<any | null>(null);
  const [deptBillPreview, setDeptBillPreview] = useState<any | null>(null);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [qrPayload, setQrPayload] = useState<any | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showSplitModal, setShowSplitModal] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [generatedInvoice, setGeneratedInvoice] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false);

  // Manager call state
  const [showManagerModal, setShowManagerModal] = useState<boolean>(false);
  const [managerReason, setManagerReason] = useState<string>("VIP Guest assistance requested");
  const [managerNotice, setManagerNotice] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [waiterToast, setWaiterToast] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      setWaiterToast("Floor data synced with kitchen & bar");
      setTimeout(() => setWaiterToast(null), 2500);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Polling data
  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Dashboard metrics
      const dashRes = await fetch(`${API_BASE}/waiter/dashboard`, { headers });
      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.summary) setMetrics(d.summary);
      }

      // 2. Tables (Always dynamic from PostgreSQL/SQLite database)
      const tblRes = await fetch(`${API_BASE}/waiter/tables`, { headers });
      if (tblRes.ok) {
        const tblData = await tblRes.json();
        setTables(tblData);
        // Default posTableNumber to first available table if posTableNumber is not set
        if (tblData.length > 0 && !posTableNumber) {
          setPosTableNumber(tblData[0].table_number);
        }
      }

      // 3. Pending QR orders
      const qrRes = await fetch(`${API_BASE}/waiter/orders/pending-approval`, { headers });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setPendingOrders(qrData);
      }

      // 4. Live Prep
      const prepRes = await fetch(`${API_BASE}/waiter/orders/live-prep`, { headers });
      if (prepRes.ok) {
        const prepData = await prepRes.json();
        setLivePrepOrders(prepData);
      }

      // 5. Tables Awaiting Billing / Invoicing
      const billingRes = await fetch(`${API_BASE}/waiter/bills/pending-tables`, { headers });
      if (billingRes.ok) {
        const billingData = await billingRes.json();
        setPendingBillingTables(billingData);
      }
    } catch (e) {
      console.warn("Polling error:", e);
    }
  };

  // Initialize session from unified login if authenticated
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("publiq_auth_token");
      const storedUser = localStorage.getItem("publiq_auth_user");
      if (storedToken && storedUser) {
        const u = JSON.parse(storedUser);
        if (u.role === "WAITER" || u.role === "SUPER_ADMIN") {
          setToken(storedToken);
          setWaiter({
            id: u.id,
            name: u.fullName,
            employee_code: u.id,
            role: u.role,
          });
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
      fetchMenu();
      const interval = setInterval(fetchData, 4000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        const all: any[] = [];
        data.forEach((cat: any) => {
          if (cat.items) {
            cat.items.forEach((it: any) => all.push({ ...it, cat_name: cat.name }));
          }
        });
        setMenuItems(all);
      }
    } catch (e) {
      console.warn("Failed menu load:", e);
    }
  };

  // Auth handler
  const handlePinSubmit = async (pinCode: string) => {
    setIsLoggingIn(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/waiter/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin_code: pinCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }
      setToken(data.access_token);
      setWaiter(data.employee);
    } catch (err: any) {
      setAuthError(err.message || "Invalid Employee PIN");
      setPin("");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Numpad handler
  const handleNumpad = (char: string) => {
    if (char === "C") {
      setPin("");
    } else if (char === "⌫") {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const next = pin + char;
      setPin(next);
      if (next.length === 4) {
        handlePinSubmit(next);
      }
    }
  };

  // Department Order Approval (FOOD, BEVERAGE, or BOTH)
  const handleDepartmentApproval = async (orderId: string, department: "FOOD" | "BEVERAGE" | "BOTH", action: "ACCEPT" | "REJECT", reason?: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${orderId}/department-approval`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          department, 
          action, 
          rejection_reason: reason, 
          waiter_name: waiter?.name || "Service Steward" 
        })
      });
      if (res.ok) {
        fetchData();
        alert(`${department} items ${action === "ACCEPT" ? "dispatched to station" : "rejected"}.`);
      } else {
        const err = await res.json();
        alert(err.detail || "Action failed.");
      }
    } catch (e) {
      alert("Failed to process department approval.");
    }
  };

  // Accept QR Order
  const handleAcceptOrder = async (orderId: string) => {
    await handleDepartmentApproval(orderId, "BOTH", "ACCEPT");
  };

  // Reject QR Order
  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt("Enter rejection reason (e.g. 86'd / kitchen full):", "Item currently unavailable");
    if (!reason) return;
    await handleDepartmentApproval(orderId, "BOTH", "REJECT", reason);
  };

  // Mark Order Served
  const handleMarkServed = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${orderId}/serve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ waiter_name: waiter?.name })
      });
      if (res.ok) {
        fetchData();
        alert("Order marked as SERVED. Ready for billing.");
      }
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  // Manual POS Cart
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev[item.id];
      const qty = existing ? existing.quantity + 1 : 1;
      return { ...prev, [item.id]: { item, quantity: qty } };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        if (next[itemId].quantity > 1) {
          next[itemId].quantity -= 1;
        } else {
          delete next[itemId];
        }
      }
      return next;
    });
  };

  const cartSubtotal = Object.values(cart).reduce((acc, c) => acc + (c.item.base_price * c.quantity), 0);
  const cartGST = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const cartGrandTotal = cartSubtotal + cartGST;

  const handleDispatchManualOrder = async () => {
    const items = Object.values(cart).map(c => ({
      item_id: c.item.id,
      item_name: c.item.name,
      quantity: c.quantity,
      unit_price: c.item.base_price,
      is_alcohol: c.item.is_alcohol
    }));

    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/waiter/orders/manual`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: posTableNumber,
          waiter_name: waiter?.name || "Service Steward",
          items
        })
      });
      if (res.ok) {
        setCart({});
        fetchData();
        alert(`Order created for Table ${posTableNumber}! Dispatched to Kitchen & Bar.`);
        setActiveTab("tracking");
      }
    } catch (e) {
      alert("Failed to create order.");
    }
  };

  // Physical QR Scanner / Token Verification
  const handleVerifyQR = async (tokenOrTable: string) => {
    const query = tokenOrTable.trim();
    if (!query) {
      setScanError("Please enter table number or scan a table QR.");
      return;
    }
    setIsScanning(true);
    setScanError("");
    try {
      const res = await fetch(`${API_BASE}/waiter/qr/verify-table`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ token: query })
      });
      const d = await res.json();
      if (res.ok && d.status === "verified") {
        setScanResult(d);
        fetchData();
        // Stop camera if running
        stopCamera();
      } else {
        setScanError(d.detail || "Unable to verify physical table QR.");
        setScanResult(null);
      }
    } catch (e) {
      setScanError("Network error while verifying table token.");
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  // Start Camera Feed
  const startCamera = async () => {
    setScanError("");
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      setScanError("Camera access unavailable. Use photo scan or manual table entry below.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Handle Photo QR File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate reading or prompt confirmation
      const guess = prompt(`Scanned photo "${file.name}". Enter table number if detected:`, "04");
      if (guess) {
        handleVerifyQR(guess);
      }
    }
  };

  // Billing Fetch
  const fetchBillForTable = async (tNum: string) => {
    setBillTableNum(tNum);
    try {
      const deptRes = await fetch(`${API_BASE}/waiter/bills/department-preview/${tNum}?discount_pct=${discountPct}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (deptRes.ok) {
        const dd = await deptRes.json();
        setDeptBillPreview(dd);
        const f = dd.food_bill || {};
        const b = dd.beverage_bill || {};
        setBillPreview({
          order_id: dd.order_id,
          order_number: dd.order_number,
          table_number: dd.table_number,
          customer_name: dd.customer_name || "Dine-in Guest",
          subtotal: (f.subtotal || 0) + (b.subtotal || 0),
          discount_amount: (f.discount_amount || 0) + (b.discount_amount || 0),
          taxable_amount: (f.taxable_amount || 0) + (b.taxable_amount || 0),
          cgst: (f.cgst || 0) + (b.cgst || 0),
          sgst: (f.sgst || 0) + (b.sgst || 0),
          grand_total: dd.combined_summary?.combined_total || ((f.grand_total || 0) + (b.grand_total || 0)),
          items: [
            ...(f.items || []).map((i: any) => ({ ...i, department: "FOOD" })),
            ...(b.items || []).map((i: any) => ({ ...i, department: "BEVERAGE" }))
          ]
        });
        return;
      }
    } catch (_) {}

    try {
      const res = await fetch(`${API_BASE}/waiter/bills/preview/${tNum}?discount_pct=${discountPct}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setBillPreview(d);
        setDeptBillPreview(null);
      } else {
        setBillPreview(null);
        setDeptBillPreview(null);
      }
    } catch (e) {
      setBillPreview(null);
      setDeptBillPreview(null);
    }
  };

  useEffect(() => {
    if (token && activeTab === "billing") {
      fetchBillForTable(billTableNum);
    }
  }, [billTableNum, discountPct, activeTab]);

  const handleGenerateDepartmentInvoice = async (department: "FOOD" | "BEVERAGE") => {
    if (!billPreview) return;
    setIsGeneratingInvoice(true);
    try {
      const res = await fetch(`${API_BASE}/waiter/bills/generate-department-invoice`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: billTableNum,
          order_id: billPreview.order_id,
          department,
          discount_pct: discountPct,
          waiter_name: waiter?.name || "Service Steward"
        })
      });
      if (res.ok) {
        const inv = await res.json();
        setGeneratedInvoice(inv);
        setShowInvoiceModal(true);
        fetchBillForTable(billTableNum);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || `Failed to generate ${department} invoice.`);
      }
    } catch (e) {
      alert("Invoice generation failed.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Generate Official Tax Invoice
  const handleGenerateInvoice = async () => {
    if (deptBillPreview?.food_bill && deptBillPreview?.beverage_bill) {
      const choice = confirm("Click OK to generate Food Invoice (Ramesh S P: PUB-FOOD-...) or Cancel to generate Drinks Invoice (Anil: PUB-BEV-...)");
      if (choice) {
        await handleGenerateDepartmentInvoice("FOOD");
      } else {
        await handleGenerateDepartmentInvoice("BEVERAGE");
      }
      return;
    }

    if (!billPreview) return;
    setIsGeneratingInvoice(true);
    try {
      const res = await fetch(`${API_BASE}/waiter/bills/generate-invoice`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: billTableNum,
          order_id: billPreview.order_id,
          discount_pct: discountPct,
          waiter_name: waiter?.name || "Service Steward"
        })
      });
      if (res.ok) {
        const inv = await res.json();
        setGeneratedInvoice(inv);
        setShowInvoiceModal(true);
        fetchData();
      } else {
        alert("Failed to generate official invoice.");
      }
    } catch (e) {
      alert("Invoice generation failed.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Generate Dynamic Exact-Amount UPI QR
  const handleGenerateUPIQR = async () => {
    if (!billPreview) return;
    try {
      const res = await fetch(`${API_BASE}/waiter/payments/generate-qr`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: billTableNum,
          amount: billPreview.grand_total,
          order_id: billPreview.order_id
        })
      });
      if (res.ok) {
        const d = await res.json();
        setQrPayload(d);
        setShowQRModal(true);
      }
    } catch (e) {
      alert("Failed to generate payment QR.");
    }
  };

  // Close Order & Release Table (Defect 5)
  const handleCloseOrder = async () => {
    if (!billPreview) return;
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${billPreview.order_id}/close`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          role: "WAITER",
          waiter_name: waiter?.name || "Service Steward",
          waiter_id: waiter?.id
        })
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || `Order closed successfully! Table ${billTableNum} is now released.`);
        fetchData();
        setBillPreview(null);
        setActiveTab("tables");
      } else {
        alert(d.detail || "Cannot close order yet. Ensure invoices are generated, full payment received, and all items served.");
      }
    } catch (e) {
      alert("Error closing order.");
    }
  };

  // Reject Item with Mandatory Reason (Defect 2)
  const handleRejectOrderItem = async (orderId: string, itemId: string, itemName: string) => {
    const reason = prompt(`Enter mandatory rejection reason for ${itemName} (e.g. Kitchen/Bar stock exhausted):`);
    if (!reason || !reason.trim()) {
      alert("A rejection reason is mandatory.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${orderId}/items/${itemId}/reject`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          reason: reason.trim(),
          waiter_name: waiter?.name || "Service Steward"
        })
      });
      if (res.ok) {
        alert(`Item '${itemName}' rejected and excluded from order billing.`);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to reject item.");
      }
    } catch (_) {
      alert("Error rejecting item.");
    }
  };

  // Claim unassigned order (Defect 2.B & 3.C)
  const handleClaimOrder = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/orders/${orderId}/claim`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          waiter_name: waiter?.name || "Service Steward",
          waiter_id: waiter?.id
        })
      });
      if (res.ok) {
        alert("Order assigned to your queue successfully!");
        fetchData();
      }
    } catch (_) {}
  };

  // Settle Bill
  const handleSettle = async (mode: string) => {
    if (!billPreview) return;
    try {
      const res = await fetch(`${API_BASE}/waiter/payments/settle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: billTableNum,
          order_id: billPreview.order_id,
          payment_mode: mode,
          amount_paid: billPreview.grand_total,
          waiter_name: waiter?.name || "Service Steward"
        })
      });
      if (res.ok) {
        const d = await res.json();
        setShowQRModal(false);
        setShowSplitModal(false);
        fetchData();
        setBillPreview(null);
        alert(`Bill ${d.bill_number} settled via ${mode}!\nTable ${billTableNum} is now freed and available for seating.`);
        setActiveTab("tables");
      }
    } catch (e) {
      alert("Payment settlement failed.");
    }
  };

  // Manager Call
  const handleCallManager = async () => {
    try {
      const res = await fetch(`${API_BASE}/waiter/service/call-manager`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          table_number: billTableNum || "Floor",
          waiter_name: waiter?.name || "Service Steward",
          reason: managerReason
        })
      });
      if (res.ok) {
        setShowManagerModal(false);
        alert("Duty Manager notified on floor master console.");
      }
    } catch (e) {
      alert("Failed to alert manager.");
    }
  };

  // Filtered Tables
  const filteredTables = tables.filter(t => {
    if (tableFilter === "ALL") return true;
    if (tableFilter === "OCCUPIED") return t.is_occupied;
    if (tableFilter === "AVAILABLE") return !t.is_occupied;
    if (tableFilter === "BILL_REQUESTED") return t.wants_bill || t.status === "BILLING" || t.status === "READY_TO_SERVE";
    return true;
  });

  // If Not Authenticated -> Show Steward PIN Login Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col items-center">
          {/* Official PUBLIQ Luxury Crest Logo */}
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.png?v=7" 
              alt="PUBLIQ" 
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" 
            />
          </div>

          <span className="text-[10px] font-bold tracking-[0.3em] text-[#D4AF37] uppercase">PUBLIQ HARAGADDE</span>
          <h1 className="text-xl font-bold tracking-[0.2em] text-slate-800 uppercase mt-0.5">PUBLIQ STEWARD</h1>
          <p className="text-[11px] text-slate-400 tracking-wider uppercase mt-1 mb-5 font-semibold">Service Steward Mobile App</p>

          <p className="text-xs text-slate-300 font-medium mb-3">Enter 4-Digit Employee PIN</p>

          {/* PIN Dots */}
          <div className="flex gap-4 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 border-[#D4AF37] transition-all duration-200 ${
                  pin.length > i ? "bg-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.6)]" : "bg-transparent"
                }`}
              />
            ))}
          </div>

          {authError && (
            <p className="text-xs text-rose-400 font-bold mb-4 bg-rose-950/40 border border-rose-800 px-3 py-1.5 rounded-lg text-center">
              {authError}
            </p>
          )}

          {/* Quick Ergonomic Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full mb-5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(k => (
              <button
                key={k}
                onClick={() => handleNumpad(k)}
                disabled={isLoggingIn}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-[#1E2B45] active:scale-95 text-lg font-bold text-white border border-slate-200 transition-all flex items-center justify-center shadow-md"
              >
                {k}
              </button>
            ))}
          </div>

          <a
            href="https://expo.dev/artifacts/eas/LtMYT2uVL7ZC19BJSr0VGKnvxi-URSRNtcXTzvhc9kE.apk"
            target="_blank"
            rel="noopener noreferrer"
            download="publiq-w.apk"
            className="w-full py-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 tracking-wider transition-all flex items-center justify-center gap-2 mb-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download PUBLIQ W v2.0.3 APK (83.3 MB)
          </a>

          <a
            href="/publiq-w.apk"
            download="publiq-w.apk"
            className="w-full py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-200 text-[10px] font-semibold text-slate-300 tracking-wider transition-all flex items-center justify-center gap-1.5"
          >
            Direct Mirror Download (Server Direct)
          </a>
        </div>
      </div>
    );
  }

  // Authenticated Steward Viewport
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex justify-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col border-x border-slate-200 shadow-xl relative pb-24">
        
        {/* Top Operational Bar */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 p-0.5 border border-amber-200/80 flex items-center justify-center shadow-xs">
              <img src="/logo-badge.png?v=7" alt="PUBLIQ" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-widest text-[#D4AF37]">PUBLIQ W</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">ONLINE</span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider truncate max-w-[150px]">
                {waiter?.name || "Steward"} • Floor Active
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center">
            <LiveClock variant="badge" showSeconds={true} showDate={true} className="bg-slate-900 border-slate-700 text-slate-200" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("scan")}
              className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 shadow-sm transition-all ${
                activeTab === "scan" 
                  ? "bg-[#D4AF37] text-black border-[#D4AF37]" 
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title="Scan Table QR"
            >
              <Scan className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowManagerModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-600/50 text-[10px] font-bold text-rose-300 hover:bg-rose-900 flex items-center gap-1 shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              MGR
            </button>
            <button
              onClick={handleExit}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 overflow-y-auto">

          {/* TAB 1: OPERATIONAL FLOOR DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              {/* Shift Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-md flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase block">PUBLIQ HARAGADDE</span>
                  <h2 className="text-base font-bold text-white mt-0.5">Floor Operational Command</h2>
                  <p className="text-xs text-slate-400 mt-1">Logged in as {waiter?.name} ({waiter?.role})</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#D4AF37]">{tables.length}</span>
                  <span className="text-[9px] text-slate-400 block font-semibold">TOTAL TABLES</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => {
                    setTableFilter("ALL");
                    setActiveTab("tables");
                  }} 
                  className="bg-[#111927] border border-slate-200 p-3.5 rounded-2xl cursor-pointer hover:border-slate-200 shadow-sm"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">AVAILABLE TABLES</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{metrics.available_tables}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">{metrics.occupied_tables} Currently Seated</span>
                </div>

                <div 
                  onClick={() => setActiveTab("qr_orders")} 
                  className={`bg-[#111927] border p-3.5 rounded-2xl cursor-pointer shadow-sm ${
                    pendingOrders.length > 0 ? "border-amber-500/70 bg-amber-950/25" : "border-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">QR DINER ORDERS</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingOrders.length}</span>
                  <span className="text-[10px] text-amber-300 mt-1 block">Needs Steward Approval</span>
                </div>

                <div 
                  onClick={() => setActiveTab("tracking")} 
                  className="bg-[#111927] border border-slate-200 p-3.5 rounded-2xl cursor-pointer hover:border-slate-200 shadow-sm"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">KDS / BAR PREP</span>
                  <span className="text-2xl font-black text-blue-400 mt-1 block">{livePrepOrders.length}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Live Tickets Active</span>
                </div>

                <div 
                  onClick={() => setActiveTab("billing")} 
                  className={`bg-[#111927] border p-3.5 rounded-2xl cursor-pointer shadow-sm ${
                    pendingBillingTables.length > 0 ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">BILLING & INVOICES</span>
                  <span className="text-2xl font-black text-[#D4AF37] mt-1 block">{pendingBillingTables.length}</span>
                  <span className="text-[10px] text-[#D4AF37] mt-1 block">Tables Unsettled</span>
                </div>
              </div>

              {/* Quick Action Bar */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setActiveTab("scan")}
                  className="p-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-black font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <Scan className="w-4 h-4" />
                  SCAN TABLE QR
                </button>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="p-3 rounded-xl bg-slate-50 border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-[#1E2B45]"
                >
                  <Plus className="w-4 h-4" />
                  CREATE ORDER (+POS)
                </button>
              </div>

              {/* Pending Bills Quick Alert List */}
              {pendingBillingTables.length > 0 && (
                <div className="bg-[#131B2A] border border-[#D4AF37]/60 p-4 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                        TABLES AWAITING BILL ({pendingBillingTables.length})
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveTab("billing")} 
                      className="text-[10px] text-[#D4AF37] hover:underline font-bold"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pendingBillingTables.map(pt => (
                      <div 
                        key={pt.table_number}
                        onClick={() => {
                          setBillTableNum(pt.table_number);
                          setActiveTab("billing");
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:border-[#D4AF37]/50 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">Table {pt.table_number}</span>
                            <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">
                              {pt.order_status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {pt.customer_name} • {pt.items_count} items
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-[#D4AF37]">₹{pt.final_amount.toFixed(0)}</span>
                          <span className="text-[9px] text-emerald-400 block font-semibold">Tap to Bill →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TABLES FLOOR PLAN (DYNAMIC - ALL ADMIN ADDED TABLES SHOW) */}
          {activeTab === "tables" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                    FLOOR PLAN ({tables.length} TABLES)
                  </h2>
                  <p className="text-[10px] text-slate-400">All venue tables synced in real time</p>
                </div>
                <button onClick={handleManualRefresh} disabled={isRefreshing} className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isRefreshing ? "animate-spin" : ""}`} /> 
                  <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                </button>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: "ALL", label: `ALL (${tables.length})` },
                  { key: "OCCUPIED", label: `OCCUPIED (${metrics.occupied_tables})` },
                  { key: "AVAILABLE", label: `AVAILABLE (${metrics.available_tables})` },
                  { key: "BILL_REQUESTED", label: `BILLING (${pendingBillingTables.length})` }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTableFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      tableFilter === f.key 
                        ? "bg-[#D4AF37] text-black shadow-md" 
                        : "bg-slate-50 text-slate-400 hover:text-slate-200 border border-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Tables Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredTables.map(t => {
                  const hasOrder = !!t.active_order;
                  return (
                    <div
                      key={t.id || t.table_number}
                      onClick={() => setSelectedTable(t)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-sm ${
                        hasOrder
                          ? "bg-[#131B2A] border-[#D4AF37]/60 shadow-md text-white"
                          : t.is_occupied
                          ? "bg-slate-900 border-amber-600/40 text-white"
                          : "bg-white border-slate-200 hover:border-blue-400 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-black ${hasOrder || t.is_occupied ? "text-white" : "text-slate-900"}`}>T-{t.table_number}</span>
                        <span className="text-[10px] text-slate-400 font-medium">👥 {t.capacity}</span>
                      </div>

                      <div className="my-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded inline-block ${
                          t.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-800 border border-emerald-300" :
                          t.status === "READY_TO_SERVE" ? "bg-emerald-100 text-emerald-900 border border-emerald-500" :
                          t.status === "PREPARING" ? "bg-blue-100 text-blue-900 border border-blue-400" :
                          t.status === "BILLING" ? "bg-amber-100 text-amber-900 border border-amber-400" :
                          "bg-slate-100 text-slate-800 border border-slate-300"
                        }`}>
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {hasOrder ? (
                        <div className="border-t border-slate-200/80 pt-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-[#D4AF37]">₹{t.active_order.final_amount.toFixed(0)}</span>
                          <span className="text-[10px] text-slate-400">{t.active_order.items_count} items</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-medium">Tap to seat guest</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table Command Modal */}
          {selectedTable && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                      T-{selectedTable.table_number}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">Table {selectedTable.table_number}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedTable.is_occupied || selectedTable.status !== "AVAILABLE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {selectedTable.status?.replace(/_/g, " ") || (selectedTable.is_occupied ? "OCCUPIED" : "AVAILABLE")}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Dining Capacity</span>
                      <span className="font-bold text-slate-900">👥 {selectedTable.capacity} Guests</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Section / Area</span>
                      <span className="font-bold text-slate-900">{selectedTable.dining_area || "Main Dining & Atrium"}</span>
                    </div>
                    {selectedTable.active_order && (
                      <>
                        <div className="flex justify-between text-slate-600 pt-1.5 border-t border-slate-200">
                          <span>Active KOT Order</span>
                          <span className="font-mono font-bold text-blue-700">#{selectedTable.active_order.order_number}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Order Subtotal</span>
                          <span className="font-bold text-slate-900">₹{selectedTable.active_order.final_amount || selectedTable.active_order.subtotal}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setPosTableNumber(selectedTable.table_number);
                        setActiveTab("menu");
                        setSelectedTable(null);
                      }}
                      className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Take Order (+POS)</span>
                    </button>
                    <button
                      onClick={() => {
                        setBillTableNum(selectedTable.table_number);
                        setActiveTab("billing");
                        setSelectedTable(null);
                      }}
                      className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>View Bill / Settle</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHYSICAL TABLE QR SCANNER & VERIFICATION */}
          {activeTab === "scan" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                    PHYSICAL TABLE QR SCANNER
                  </h2>
                  <p className="text-[10px] text-slate-400">Scan QR sticker on dining table or enter table code</p>
                </div>
                <button onClick={() => setScanResult(null)} className="text-xs text-slate-400 hover:text-white">
                  Reset
                </button>
              </div>

              {/* Camera Scanner Viewport */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl text-center space-y-3">
                <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/60 flex items-center justify-center">
                  {cameraActive ? (
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover" 
                      playsInline 
                      muted 
                    />
                  ) : (
                    <div className="p-4 flex flex-col items-center justify-center text-slate-500">
                      <Camera className="w-12 h-12 text-[#D4AF37]/60 mb-2 animate-pulse" />
                      <p className="text-xs text-slate-300 font-semibold">Camera Scanner Ready</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Align physical table QR sticker inside viewfinder</p>
                    </div>
                  )}

                  {/* Corner Targets */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]" />
                </div>

                {/* Camera Trigger Buttons */}
                <div className="flex gap-2 justify-center">
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      OPEN LIVE CAMERA
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs tracking-wider flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      STOP CAMERA
                    </button>
                  )}

                  {/* Photo QR Upload Fallback */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-[#1E2B45]"
                  >
                    <Download className="w-4 h-4" />
                    PHOTO QR
                  </button>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </div>
              </div>

              {/* Direct Table Keypad Verification (Works on every phone instantly) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  FAST PHYSICAL TABLE SELECTOR:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {tables.map(t => (
                    <button
                      key={t.table_number}
                      onClick={() => handleVerifyQR(t.table_number)}
                      className="py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 text-xs font-bold text-slate-900 flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                    >
                      <span>T-{t.table_number}</span>
                      <span className="text-[9px] text-slate-500 font-medium">👥 {t.capacity}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <input 
                    type="text" 
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    placeholder="Or enter token / table (e.g. 04, T-04)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500"
                    onKeyDown={e => {
                      if (e.key === "Enter") handleVerifyQR(scanInput);
                    }}
                  />
                  <button
                    onClick={() => handleVerifyQR(scanInput)}
                    disabled={isScanning}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-bold text-xs"
                  >
                    {isScanning ? "Checking..." : "VERIFY"}
                  </button>
                </div>
              </div>

              {scanError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold text-center">
                  {scanError}
                </div>
              )}

              {/* Verification Result Card */}
              {scanResult && (
                <div className="bg-blue-50/50 border-2 border-[#D4AF37] rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <span className="text-lg font-black text-slate-900">Table {scanResult.table_number}</span>
                        <p className="text-[10px] text-slate-500 font-medium">Capacity: 👥 {scanResult.capacity} Guests • Verified</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                      scanResult.is_occupied ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    }`}>
                      {scanResult.status_label || (scanResult.is_occupied ? "OCCUPIED" : "AVAILABLE")}
                    </span>
                  </div>

                  {scanResult.active_order ? (
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Active Order:</span>
                        <span className="text-slate-900 font-mono font-bold">{scanResult.active_order.order_number}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Guest:</span>
                        <span className="text-slate-900 font-semibold">{scanResult.active_order.customer_name}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                        <span className="text-blue-700 font-bold">Unsettled Total:</span>
                        <span className="text-slate-900 font-black">₹{scanResult.active_order.final_amount.toFixed(0)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Table is currently empty and sanitized for new guests.
                    </p>
                  )}

                  {/* 1-Tap Action Routing */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setPosTableNumber(scanResult.table_number);
                        setActiveTab("menu");
                      }}
                      className="py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-black font-black text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      TAKE ORDER (+POS)
                    </button>

                    <button
                      onClick={() => {
                        setBillTableNum(scanResult.table_number);
                        setActiveTab("billing");
                      }}
                      className="py-3 rounded-xl bg-slate-50 border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#1E2B45]"
                    >
                      <Receipt className="w-4 h-4" />
                      VIEW BILL / SETTLE
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QR INBOUND ORDERS (FROM CUSTOMER PHONES) */}
          {activeTab === "qr_orders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                    DINER QR QUEUE ({pendingOrders.length})
                  </h2>
                  <p className="text-[10px] text-slate-400">Orders placed by guests requiring steward confirmation</p>
                </div>
                <button onClick={handleManualRefresh} disabled={isRefreshing} className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isRefreshing ? "animate-spin" : ""}`} /> 
                  <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                </button>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">All Clear</p>
                  <p className="text-xs text-slate-400 mt-1">No customer QR orders currently waiting for approval.</p>
                </div>
              ) : (
                pendingOrders.map(order => (
                  <div key={order.order_id} className="bg-white border border-[#D4AF37] rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-base font-black text-[#D4AF37]">TABLE {order.table_number}</span>
                        <p className="text-[10px] font-mono text-slate-400">{order.order_number}</p>
                      </div>
                      <span className="text-lg font-black text-white">₹{order.final_amount.toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Guest: <span className="font-semibold text-white">{order.customer_name}</span> {order.customer_phone ? `(${order.customer_phone})` : ""}
                    </p>

                    {order.special_instructions && (
                      <div className="bg-amber-950/40 border-l-2 border-amber-500 p-2 rounded text-[11px] text-amber-300 font-medium">
                        Note: {order.special_instructions}
                      </div>
                    )}

                    {/* Food Items */}
                    {order.food_items && order.food_items.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">🍳 Kitchen Dishes ({order.food_items.length}) • Owner: Ramesh S P</p>
                          {order.food_status === "ACCEPTED" ? (
                            <span className="text-[10px] text-emerald-400 font-bold">✓ IN KITCHEN</span>
                          ) : order.food_status === "REJECTED" ? (
                            <span className="text-[10px] text-rose-400 font-bold">✕ REJECTED</span>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDepartmentApproval(order.order_id, "FOOD", "ACCEPT")}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                              >
                                Accept Food
                              </button>
                              <button
                                onClick={() => handleDepartmentApproval(order.order_id, "FOOD", "REJECT", "Unavailable")}
                                className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-rose-300 text-[10px] font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                        {order.food_items.map((fi: any) => (
                          <div key={fi.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-200/40">
                            <span className="text-slate-200">
                              <span className="text-[#D4AF37] font-bold">{fi.quantity}x</span> {fi.item_name}
                              {fi.item_status === "REJECTED" && (
                                <span className="ml-2 text-[10px] text-rose-400 font-bold">(REJECTED)</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">₹{fi.total_price.toFixed(2)}</span>
                              {fi.item_status !== "REJECTED" && (
                                <button
                                  onClick={() => handleRejectOrderItem(order.order_id, fi.id, fi.item_name)}
                                  className="text-[9px] font-bold text-rose-400 hover:text-rose-200 px-1.5 py-0.5 rounded border border-rose-800/60 hover:bg-rose-950"
                                  title="Reject Item with Reason"
                                >
                                  Reject Item
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Drink Items */}
                    {order.drink_items && order.drink_items.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-200/60">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">🍸 Artisan Bar Drinks ({order.drink_items.length}) • Owner: Anil</p>
                          {order.beverage_status === "ACCEPTED" ? (
                            <span className="text-[10px] text-[#38BDF8] font-bold">✓ IN BAR</span>
                          ) : order.beverage_status === "REJECTED" ? (
                            <span className="text-[10px] text-rose-400 font-bold">✕ REJECTED</span>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDepartmentApproval(order.order_id, "BEVERAGE", "ACCEPT")}
                                className="px-2 py-0.5 rounded bg-[#38BDF8] hover:bg-sky-400 text-black text-[10px] font-bold"
                              >
                                Accept Drinks
                              </button>
                              <button
                                onClick={() => handleDepartmentApproval(order.order_id, "BEVERAGE", "REJECT", "Unavailable")}
                                className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-rose-300 text-[10px] font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                        {order.drink_items.map((di: any) => (
                          <div key={di.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-200/40">
                            <span className="text-slate-200">
                              <span className="text-[#38BDF8] font-bold">{di.quantity}x</span> {di.item_name} ({di.variant_name || "Standard"})
                              {di.item_status === "REJECTED" && (
                                <span className="ml-2 text-[10px] text-rose-400 font-bold">(REJECTED)</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">₹{di.total_price.toFixed(2)}</span>
                              {di.item_status !== "REJECTED" && (
                                <button
                                  onClick={() => handleRejectOrderItem(order.order_id, di.id, di.item_name)}
                                  className="text-[9px] font-bold text-rose-400 hover:text-rose-200 px-1.5 py-0.5 rounded border border-rose-800/60 hover:bg-rose-950"
                                  title="Reject Drink Item with Reason"
                                >
                                  Reject Item
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleRejectOrder(order.order_id)}
                        className="py-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold hover:bg-rose-900"
                      >
                        ✕ REJECT
                      </button>
                      <button
                        onClick={() => handleAcceptOrder(order.order_id)}
                        className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black tracking-wider hover:opacity-95 shadow-md shadow-emerald-600/30"
                      >
                        ✓ ACCEPT & DISPATCH
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: KDS & BAR LIVE TRACKING */}
          {activeTab === "tracking" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                    PREP TRACKER &amp; SERVING
                  </h2>
                  <p className="text-[10px] text-slate-400">Kitchen KDS & Bar dispense monitoring</p>
                </div>
                <button onClick={handleManualRefresh} disabled={isRefreshing} className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isRefreshing ? "animate-spin" : ""}`} /> 
                  <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                </button>
              </div>

              {livePrepOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <Utensils className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No Orders in Preparation</p>
                  <p className="text-xs text-slate-400 mt-1">All kitchen and bar tickets have been served.</p>
                </div>
              ) : (
                livePrepOrders.map(ord => (
                  <div key={ord.order_id} className={`p-4 rounded-2xl border space-y-3 ${ord.status === "READY" ? "bg-blue-50/50 border-emerald-500" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-[#D4AF37]">TABLE {ord.table_number}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{ord.order_number}</p>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${ord.is_delayed ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-slate-800 text-slate-300"}`}>
                          ⏱ {ord.elapsed_minutes}m elapsed
                        </span>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1">{ord.status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px]">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Kitchen KDS</span>
                        <span className="text-white font-semibold">{ord.food_status}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Bar Dispense</span>
                        <span className="text-white font-semibold">{ord.beverage_status}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {ord.items.map((it: any) => (
                        <div key={it.id} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-slate-200"><span className="text-[#D4AF37] font-bold">{it.quantity}x</span> {it.item_name}</span>
                          <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{it.station}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setBillTableNum(ord.table_number);
                          setActiveTab("billing");
                        }}
                        className="py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
                      >
                        VIEW BILL
                      </button>

                      <button
                        onClick={() => handleMarkServed(ord.order_id)}
                        className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black tracking-wider hover:bg-emerald-700 shadow-xs"
                      >
                        ✓ MARK SERVED
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: MANUAL STEWARD POS ORDERING */}
          {activeTab === "menu" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#111927] p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D4AF37]">TABLE:</span>
                  <select
                    value={posTableNumber}
                    onChange={e => setPosTableNumber(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    {tables.map(t => (
                      <option key={t.table_number} value={t.table_number}>
                        Table {t.table_number} ({t.capacity}p) {t.is_occupied ? "• Occ" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-[10px] text-slate-400 font-semibold">
                  Cart: {Object.keys(cart).length} Items
                </span>
              </div>

              {/* Category Picker */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === "all" ? "bg-[#D4AF37] text-black" : "bg-slate-50 text-slate-300"
                  }`}
                >
                  All Items
                </button>
                {categories.map((c: any) => (
                  <button
                    key={c.id || c.slug}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === c.name ? "bg-[#D4AF37] text-black" : "bg-slate-50 text-slate-300"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 281 culinary & bar items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {menuItems
                  .filter((it: any) => {
                    const matchesCat = selectedCategory === "all" || it.cat_name === selectedCategory;
                    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCat && matchesSearch;
                  })
                  .slice(0, 40)
                  .map((it: any) => (
                    <div key={it.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${it.is_veg ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <span className="text-xs font-semibold text-slate-900">{it.name}</span>
                        </div>
                        <span className="text-xs text-[#D4AF37] font-bold mt-0.5 block">₹{it.base_price.toFixed(2)}</span>
                      </div>

                      {cart[it.id] ? (
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <button onClick={() => removeFromCart(it.id)} className="text-slate-300 hover:text-white">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-[#D4AF37]">{cart[it.id].quantity}</span>
                          <button onClick={() => addToCart(it)} className="text-slate-300 hover:text-white">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(it)}
                          className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37] text-[11px] font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  ))}
              </div>

              {/* Cart Drawer */}
              {Object.keys(cart).length > 0 && (
                <div className="bg-[#111927] border-2 border-[#D4AF37] p-4 rounded-2xl space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-[#D4AF37] uppercase">ORDER SUMMARY (TABLE {posTableNumber})</span>
                    <button onClick={() => setCart({})} className="text-[10px] text-rose-400 hover:underline">Clear</button>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.values(cart).map(c => (
                      <div key={c.item.id} className="flex justify-between text-xs text-slate-300">
                        <span>{c.quantity}x {c.item.name}</span>
                        <span>₹{(c.item.base_price * c.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-white">
                    <span>Grand Total (incl 5% GST):</span>
                    <span className="text-[#D4AF37]">₹{cartGrandTotal.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleDispatchManualOrder}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-black font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    DISPATCH ORDER TO KITCHEN &amp; BAR
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: BILLING, INVOICE & PAYMENTS (COMPLETE REVENUE MODULE) */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                    INVOICE &amp; UPI SETTLEMENT
                  </h2>
                  <p className="text-[10px] text-slate-400">Generate GST invoices, dynamic UPI QR and payments</p>
                </div>
                <button onClick={handleManualRefresh} disabled={isRefreshing} className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isRefreshing ? "animate-spin" : ""}`} /> 
                  <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                </button>
              </div>

              {/* 1. TABLES REQUIRING BILL (Highlights tables waiting for bill approval) */}
              {pendingBillingTables.length > 0 && (
                <div className="bg-[#111927] border border-amber-500/60 p-3.5 rounded-2xl space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      TABLES AWAITING BILL ({pendingBillingTables.length})
                    </span>
                    <span className="text-[9px] text-slate-400">Tap table to load bill</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {pendingBillingTables.map(pt => (
                      <button
                        key={pt.table_number}
                        onClick={() => fetchBillForTable(pt.table_number)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          billTableNum === pt.table_number 
                            ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg" 
                            : "bg-white text-white border-amber-800/40 hover:border-[#D4AF37]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Table {pt.table_number}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            billTableNum === pt.table_number ? "bg-blue-600 text-white" : "bg-amber-100 text-amber-800"
                          }`}>
                            {pt.order_status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] opacity-80 truncate max-w-[80px]">{pt.customer_name}</span>
                          <span className="text-xs font-black">₹{pt.final_amount.toFixed(0)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. DYNAMIC TABLE PICKER (Shows ALL venue tables dynamically from DB) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ALL OUTLET TABLES ({tables.length} TABLES):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {tables.map(t => {
                    const isSelected = billTableNum === t.table_number;
                    return (
                      <button
                        key={t.table_number}
                        onClick={() => fetchBillForTable(t.table_number)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-md"
                            : t.is_occupied
                            ? "bg-slate-50 text-amber-300 border-amber-600/40"
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-200"
                        }`}
                      >
                        <span>T-{t.table_number}</span>
                        {t.is_occupied && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!billPreview ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No Unsettled Order on Table {billTableNum}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Select an occupied table with an active dining session above to generate an invoice.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xl">
                  {/* Bill Header */}
                  <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#D4AF37]">PUBLIQ BAR &amp; RESTAURANT</p>
                      <p className="text-[10px] text-slate-400 font-mono">5% GST Non-ITC • SAC 996331</p>
                    </div>
                    <span className="text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-1 rounded-full">
                      TABLE {billTableNum}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {billPreview.items.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-xs py-0.5">
                        <span className="text-slate-200">
                          <span className="text-[#D4AF37] font-bold">{it.quantity}x</span> {it.item_name}
                        </span>
                        <span className="text-slate-300 font-medium">₹{it.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Staff Courtesy Discount */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs">
                    <span className="text-slate-300">Staff Courtesy Discount:</span>
                    <div className="flex gap-1.5">
                      {[0, 5, 10, 15, 20].map(d => (
                        <button
                          key={d}
                          onClick={() => setDiscountPct(d)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            discountPct === d ? "bg-[#D4AF37] text-black" : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculation Box */}
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{billPreview.subtotal.toFixed(2)}</span>
                    </div>
                    {discountPct > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Discount ({discountPct}%)</span>
                        <span>-₹{billPreview.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>CGST (2.5%)</span>
                      <span>₹{billPreview.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>SGST (2.5%)</span>
                      <span>₹{billPreview.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-[#D4AF37] pt-2 border-t border-slate-200">
                      <span>TOTAL PAYABLE</span>
                      <span>₹{billPreview.grand_total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Dual Business Department Actions */}
                  {deptBillPreview && (
                    <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Dual-Business Department Invoicing
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleGenerateDepartmentInvoice("FOOD")}
                          disabled={isGeneratingInvoice}
                          className="p-2.5 rounded-lg bg-slate-50 border border-[#D4AF37]/50 text-[#D4AF37] text-[11px] font-bold hover:bg-[#1E2B45] text-left"
                        >
                          <span className="block text-[9px] text-slate-400">RAMESH S P (FOOD)</span>
                          <span className="font-serif">₹{(deptBillPreview.food_bill?.grand_total || 0).toFixed(2)}</span>
                          <span className="block text-[8px] text-emerald-400 mt-0.5">PUB-FOOD Invoice →</span>
                        </button>

                        <button
                          onClick={() => handleGenerateDepartmentInvoice("BEVERAGE")}
                          disabled={isGeneratingInvoice}
                          className="p-2.5 rounded-lg bg-slate-50 border border-[#38BDF8]/50 text-[#38BDF8] text-[11px] font-bold hover:bg-[#1E2B45] text-left"
                        >
                          <span className="block text-[9px] text-slate-400">ANIL (BAR &amp; DRINKS)</span>
                          <span className="font-serif">₹{(deptBillPreview.beverage_bill?.grand_total || 0).toFixed(2)}</span>
                          <span className="block text-[8px] text-sky-400 mt-0.5">PUB-BEV Invoice →</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice Generation & Payment Actions */}
                  <div className="space-y-2 pt-2">
                    {/* 1. Generate GST Tax Invoice Button */}
                    <button
                      onClick={handleGenerateInvoice}
                      disabled={isGeneratingInvoice}
                      className="w-full py-3 rounded-xl bg-slate-50 border border-[#D4AF37] text-[#D4AF37] text-xs font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-[#1E2B45] transition-all shadow-md"
                    >
                      <Receipt className="w-4 h-4" />
                      {isGeneratingInvoice ? "Creating Invoice..." : "GENERATE OFFICIAL GST INVOICE"}
                    </button>

                    {/* 2. Generate NPCI Dynamic UPI QR Button */}
                    <button
                      onClick={handleGenerateUPIQR}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-black text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/25 active:scale-95 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      GENERATE DYNAMIC UPI QR (₹{billPreview.grand_total.toFixed(2)})
                    </button>

                    {/* Cash & Card Fast Settle */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSettle("CASH")}
                        className="py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-200 text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-1.5"
                      >
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        RECORD CASH
                      </button>

                      <button
                        onClick={() => handleSettle("CARD")}
                        className="py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-200 text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        RECORD CARD
                      </button>
                    </div>

                    {/* Defect 5: Controlled Order Closure & Table Release */}
                    <button
                      onClick={handleCloseOrder}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      CLOSE ORDER &amp; RELEASE TABLE
                    </button>

                    <button
                      onClick={() => setShowSplitModal(true)}
                      className="w-full py-2 text-center text-xs text-[#D4AF37] hover:underline font-semibold"
                    >
                      Split Bill Calculator
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ERGONOMIC MOBILE NAVIGATION (7 TOUCH-FRIENDLY TABS) */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-2 px-1 z-30 shadow-lg">
          <button 
            onClick={() => setActiveTab("dashboard")} 
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
              activeTab === "dashboard" ? "text-[#D4AF37] font-bold" : "text-slate-400"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[8px] tracking-wider uppercase">FLOOR</span>
          </button>

          <button 
            onClick={() => setActiveTab("tables")} 
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
              activeTab === "tables" ? "text-[#D4AF37] font-bold" : "text-slate-400"
            }`}
          >
            <Hash className="w-4 h-4" />
            <span className="text-[8px] tracking-wider uppercase">TABLES</span>
          </button>

          <button 
            onClick={() => setActiveTab("scan")} 
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
              activeTab === "scan" ? "text-[#D4AF37] font-bold bg-[#D4AF37]/10" : "text-slate-400"
            }`}
          >
            <Scan className="w-4 h-4" />
            <span className="text-[8px] tracking-wider uppercase">SCAN QR</span>
          </button>

          <button 
            onClick={() => setActiveTab("qr_orders")} 
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg relative transition-all ${
              activeTab === "qr_orders" ? "text-[#D4AF37] font-bold" : "text-slate-400"
            }`}
          >
            <Bell className="w-4 h-4" />
            {pendingOrders.length > 0 && (
              <span className="absolute 0 right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] font-black flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
            <span className="text-[8px] tracking-wider uppercase">QUEUE</span>
          </button>

          <button 
            onClick={() => setActiveTab("tracking")} 
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg relative transition-all ${
              activeTab === "tracking" ? "text-[#D4AF37] font-bold" : "text-slate-400"
            }`}
          >
            <Clock className="w-4 h-4" />
            {livePrepOrders.length > 0 && (
              <span className="absolute 0 right-1 w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px] font-black flex items-center justify-center">
                {livePrepOrders.length}
              </span>
            )}
            <span className="text-[8px] tracking-wider uppercase">KDS/BAR</span>
          </button>

          <button 
            onClick={() => setActiveTab("menu")} 
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
              activeTab === "menu" ? "text-[#D4AF37] font-bold" : "text-slate-400"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-[8px] tracking-wider uppercase">+ORDER</span>
          </button>

          <button 
            onClick={() => setActiveTab("billing")} 
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg relative transition-all ${
              activeTab === "billing" ? "text-[#D4AF37] font-bold" : "text-slate-400"
            }`}
          >
            <Receipt className="w-4 h-4" />
            {pendingBillingTables.length > 0 && (
              <span className="absolute 0 right-1 w-3.5 h-3.5 rounded-full bg-[#D4AF37] text-black text-[8px] font-black flex items-center justify-center">
                {pendingBillingTables.length}
              </span>
            )}
            <span className="text-[8px] tracking-wider uppercase">BILLING</span>
          </button>
        </div>

        {/* Dynamic UPI Payment QR Modal (Dual-Business Support: Food & Bar) */}
        {showQRModal && qrPayload && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-xs font-black text-slate-900 tracking-wider uppercase">
                    INDEPENDENT DEPARTMENT UPI PAYMENTS
                  </span>
                </div>
                <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900">{qrPayload.formatted_amount}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Table {qrPayload.table_number} • {qrPayload.order_number}
                </p>
              </div>

              {/* DUAL QR SIDE-BY-SIDE DISPLAY IF BOTH DEPARTMENTS PRESENT */}
              {qrPayload.food_qr && qrPayload.beverage_qr && qrPayload.food_qr.amount > 0 && qrPayload.beverage_qr.amount > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  {/* FOOD PAYMENT QR (RAMESH S P) */}
                  <div className="p-5 rounded-2xl border-2 border-emerald-400/80 bg-emerald-50/30 space-y-3 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          FOOD PAYMENT
                        </span>
                        <span className="font-serif font-black text-emerald-800 text-lg">
                          ₹{qrPayload.food_qr.amount?.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1.5">{qrPayload.food_qr.owner_name} (Kitchen)</p>
                      <p className="text-[11px] font-mono text-slate-600">UPI: {qrPayload.food_qr.vpa}</p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl mx-auto shadow-sm border border-slate-200">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload.food_qr.upi_string)}`}
                        alt="Food Payment UPI QR"
                        className="w-40 h-40 mx-auto"
                      />
                    </div>

                    <p className="text-[10px] text-emerald-800 text-center font-medium">
                      Scan with PhonePe, GPay or Paytm for Food settlement
                    </p>
                  </div>

                  {/* BAR PAYMENT QR (ANIL) */}
                  <div className="p-5 rounded-2xl border-2 border-sky-400/80 bg-sky-50/30 space-y-3 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                          BAR PAYMENT
                        </span>
                        <span className="font-serif font-black text-sky-800 text-lg">
                          ₹{qrPayload.beverage_qr.amount?.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1.5">{qrPayload.beverage_qr.owner_name} (Bar & Drinks)</p>
                      <p className="text-[11px] font-mono text-slate-600">UPI: {qrPayload.beverage_qr.vpa}</p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl mx-auto shadow-sm border border-slate-200">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload.beverage_qr.upi_string)}`}
                        alt="Bar Payment UPI QR"
                        className="w-40 h-40 mx-auto"
                      />
                    </div>

                    <p className="text-[10px] text-sky-800 text-center font-medium">
                      Scan with PhonePe, GPay or Paytm for Drinks settlement
                    </p>
                  </div>
                </div>
              ) : (
                /* SINGLE QR FALLBACK */
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-2xl mx-auto inline-block shadow-md border border-slate-200">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload.upi_string)}`}
                      alt="UPI QR Code"
                      className="w-44 h-44 mx-auto"
                    />
                  </div>
                  <div className="text-xs text-slate-600 font-mono space-y-0.5">
                    <p>Payee: <strong>{qrPayload.merchant_name}</strong></p>
                    <p>VPA: {qrPayload.vpa}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="py-3 px-5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSettle("UPI")}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black tracking-wider shadow-lg transition"
                >
                  ✓ CONFIRM FULL PAYMENT SETTLED
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Tax Invoice Modal */}
        {showInvoiceModal && generatedInvoice && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-amber-600 tracking-wider uppercase">OFFICIAL TAX INVOICE</span>
                <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="text-center border-b border-slate-200 pb-2.5">
                <div className="flex items-center justify-center mb-1">
                  <img src="/logo.png?v=7" alt="PUBLIQ" className="h-12 w-auto object-contain" />
                </div>
                <h3 className="text-sm font-black text-slate-900">{generatedInvoice.outlet_name}</h3>
                <p className="text-[10px] text-slate-500">{generatedInvoice.legal_name}</p>
                <p className="text-[9px] text-slate-500 font-mono">GSTIN: {generatedInvoice.gstin} • SAC: {generatedInvoice.sac_code}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Invoice No:</span>
                  <span className="font-mono text-blue-600 font-bold">{generatedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date &amp; Time:</span>
                  <span>{generatedInvoice.invoice_date}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Table / Steward:</span>
                  <span>Table {generatedInvoice.table_number} • {generatedInvoice.waiter_name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Guest Name:</span>
                  <span>{generatedInvoice.customer_name}</span>
                </div>
              </div>

              {/* Invoice Line Items */}
              <div className="space-y-1 text-xs max-h-36 overflow-y-auto pr-1">
                {(generatedInvoice.items || billPreview?.items || []).map((it: any) => (
                  <div key={it.id || it.item_name} className="flex justify-between py-0.5 border-b border-slate-200/60">
                    <span className="text-slate-700">{it.quantity}x {it.item_name}</span>
                    <span className="text-slate-900 font-medium">₹{(it.total_price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Tax Breakdown */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{generatedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {generatedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount ({generatedInvoice.discount_percent}%)</span>
                    <span>-₹{generatedInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>CGST (2.5%)</span>
                  <span>₹{generatedInvoice.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (2.5%)</span>
                  <span>₹{generatedInvoice.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>NET PAYABLE</span>
                  <span>₹{generatedInvoice.grand_total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Printer className="w-4 h-4" />
                  PRINT RECEIPT
                </button>
                <button
                  onClick={() => {
                    setShowInvoiceModal(false);
                    handleGenerateUPIQR();
                  }}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
                >
                  <QrCode className="w-4 h-4" />
                  PAY VIA UPI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Split Bill Modal */}
        {showSplitModal && billPreview && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider">SPLIT BILL CALCULATOR</span>
                <button onClick={() => setShowSplitModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div>
                <span className="text-xs text-slate-600">Number of Guests Splitting:</span>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setSplitCount(n)}
                      className={`py-2 rounded-xl text-xs font-bold ${
                        splitCount === n ? "bg-amber-500 text-white shadow-xs" : "bg-slate-100 text-slate-800 border border-slate-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-center border border-amber-300">
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">EACH GUEST PAYS:</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  ₹{(billPreview.grand_total / splitCount).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setShowSplitModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200"
              >
                DONE
              </button>
            </div>
          </div>
        )}

        {/* Call Manager Modal */}
        {showManagerModal && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-white border border-rose-300 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-rose-400 uppercase tracking-wider">CALL DUTY MANAGER</span>
                <button onClick={() => setShowManagerModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-300">Select reason to notify manager immediately on master console:</p>

              <div className="space-y-2">
                {[
                  "VIP Guest assistance requested",
                  "Staff courtesy discount / comp approval",
                  "Allergy / culinary query",
                  "Billing discrepancy query"
                ].map(r => (
                  <button
                    key={r}
                    onClick={() => setManagerReason(r)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all ${
                      managerReason === r ? "bg-rose-950/80 border border-rose-500 text-rose-200" : "bg-slate-50 text-slate-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCallManager}
                className="w-full py-3 rounded-xl bg-rose-600 text-white text-xs font-black tracking-wider hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                DISPATCH MANAGER ALERT
              </button>
            </div>
          </div>
        )}

        {/* Real-time Waiter Refresh Toast */}
        {waiterToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2.5 border border-[#D4AF37]/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{waiterToast}</span>
          </div>
        )}

      </div>
    </div>
  );
}
