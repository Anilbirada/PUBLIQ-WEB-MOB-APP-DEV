import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Modal, TextInput, RefreshControl, Image } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { DynamicUPIQR } from "../components/DynamicUPIQR";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useLiveSync } from "../context/LiveSyncContext";

export const BillPaymentScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { token, waiter } = useAuth();
  const { refreshData } = useLiveSync();

  const [tableNumber, setTableNumber] = useState<string>(route.params?.table_number || "01");
  const [billData, setBillData] = useState<any | null>(null);
  const [deptBillData, setDeptBillData] = useState<any | null>(null);
  const [selectedDeptTab, setSelectedDeptTab] = useState<"ALL" | "FOOD" | "BEVERAGE">("ALL");
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [qrData, setQrData] = useState<any | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showSplitModal, setShowSplitModal] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [selectedTender, setSelectedTender] = useState<string>("UPI");
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [pendingTables, setPendingTables] = useState<any[]>([]);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  useEffect(() => {
    fetchTablesAndPending();
  }, []);

  const fetchTablesAndPending = async () => {
    try {
      const tbls: any = await mobileApiRequest("/waiter/tables", { method: "GET" }, token);
      if (Array.isArray(tbls)) setTablesList(tbls);

      const pends: any = await mobileApiRequest("/waiter/bills/pending-tables", { method: "GET" }, token);
      if (Array.isArray(pends)) {
        setPendingTables(pends);
        if (!route.params?.table_number && pends.length > 0) {
          setTableNumber(pends[0].table_number);
        }
      }
    } catch (e) {
      console.warn("Failed loading tables for billing:", e);
    }
  };

  useEffect(() => {
    fetchBillPreview();
  }, [tableNumber, discountPct]);

  const fetchBillPreview = async () => {
    setLoading(true);
    try {
      // 1. Fetch dual-business department preview (FOOD for Anil, BEVERAGE for Ramesh)
      const data: any = await mobileApiRequest(
        `/waiter/bills/department-preview/${tableNumber}?discount_pct=${discountPct}`,
        { method: "GET" },
        token
      );
      setDeptBillData(data);

      const f = data.food_bill || {};
      const b = data.beverage_bill || {};
      const f_items = f.items || [];
      const b_items = b.items || [];

      setBillData({
        order_id: data.order_id,
        order_number: data.order_number,
        table_number: data.table_number,
        customer_name: data.customer_name || "Dine-in Guest",
        subtotal: round2((f.subtotal || 0) + (b.subtotal || 0)),
        discount_amount: round2((f.discount_amount || 0) + (b.discount_amount || 0)),
        taxable_amount: round2((f.taxable_amount || 0) + (b.taxable_amount || 0)),
        cgst: round2((f.cgst || 0) + (b.cgst || 0)),
        sgst: round2((f.sgst || 0) + (b.sgst || 0)),
        grand_total: data.combined_summary?.combined_total || round2((f.grand_total || 0) + (b.grand_total || 0)),
        items: [...f_items.map((i: any) => ({ ...i, department: "FOOD" })), ...b_items.map((i: any) => ({ ...i, department: "BEVERAGE" }))]
      });
    } catch (e: any) {
      // Fallback to classic preview
      try {
        const classic: any = await mobileApiRequest(
          `/waiter/bills/preview/${tableNumber}?discount_pct=${discountPct}`,
          { method: "GET" },
          token
        );
        setBillData(classic);
        setDeptBillData(null);
      } catch (_) {
        setBillData(null);
        setDeptBillData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  const handleGenerateDepartmentInvoice = async (dept: "FOOD" | "BEVERAGE") => {
    if (!billData) return;
    setIsGeneratingInvoice(true);
    try {
      const inv: any = await mobileApiRequest("/waiter/bills/generate-department-invoice", {
        method: "POST",
        body: JSON.stringify({
          table_number: tableNumber,
          order_id: billData.order_id,
          department: dept,
          discount_pct: discountPct,
          waiter_name: waiter?.name || "Service Steward"
        })
      }, token);

      setGeneratedInvoice(inv);
      setShowInvoiceModal(true);
      fetchBillPreview();
      fetchTablesAndPending();
    } catch (e: any) {
      Alert.alert("Invoice Error", e.message || `Failed to create ${dept} invoice.`);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleGenerateInvoice = async () => {
    // If dual business active, ask or generate food
    if (deptBillData?.food_bill && deptBillData?.beverage_bill) {
      Alert.alert(
        "Generate Department Invoice",
        "Select which official GST invoice to generate:",
        [
          { text: "Food (Anil: PUB-FOOD-...)", onPress: () => handleGenerateDepartmentInvoice("FOOD") },
          { text: "Drinks (Ramesh: PUB-BEV-...)", onPress: () => handleGenerateDepartmentInvoice("BEVERAGE") },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    if (!billData) return;
    setIsGeneratingInvoice(true);
    try {
      const inv: any = await mobileApiRequest("/waiter/bills/generate-invoice", {
        method: "POST",
        body: JSON.stringify({
          table_number: tableNumber,
          order_id: billData.order_id,
          discount_pct: discountPct,
          waiter_name: waiter?.name || "Service Steward"
        })
      }, token);

      setGeneratedInvoice(inv);
      setShowInvoiceModal(true);
      fetchTablesAndPending();
    } catch (e: any) {
      Alert.alert("Invoice Error", e.message || "Failed to create invoice.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleShowDepartmentQR = (dept: "FOOD" | "BEVERAGE") => {
    if (!deptBillData) {
      handleGenerateUPIQR();
      return;
    }
    const isFood = dept === "FOOD";
    const bill = isFood ? deptBillData.food_bill : deptBillData.beverage_bill;
    if (!bill || bill.grand_total <= 0) {
      Alert.alert("No Items", `There are no active ${dept.toLowerCase()} items for Table ${tableNumber}.`);
      return;
    }

    const upiString = `upi://pay?pa=${bill.upi_id}&pn=${encodeURIComponent(bill.owner_name)}&am=${bill.grand_total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`PUBLIQ T-${tableNumber} ${dept}`)}`;

    setQrData({
      department: dept,
      owner_name: bill.owner_name,
      vpa: bill.upi_id,
      amount: bill.grand_total,
      upi_string: upiString,
      is_food: isFood,
      qr_instructions: `Scan & Pay via PhonePe, GPay, Paytm to ${bill.owner_name} (${isFood ? "Food Owner" : "Drinks Owner"}).`
    });
    setShowQRModal(true);
  };

  const handleGenerateUPIQR = async () => {
    if (!billData) return;
    try {
      const res: any = await mobileApiRequest("/waiter/payments/generate-qr", {
        method: "POST",
        body: JSON.stringify({
          table_number: tableNumber,
          amount: billData.grand_total,
          order_id: billData.order_id
        })
      }, token);

      setQrData({
        ...res,
        department: "COMBINED",
        owner_name: res.merchant_name || "PUBLIQ BAR & RESTAURANT"
      });
      setShowQRModal(true);
    } catch (e: any) {
      Alert.alert("QR Error", e.message || "Failed to generate dynamic payment QR.");
    }
  };

  const handleSettlePayment = async (mode: string = selectedTender) => {
    if (!billData) return;
    setIsSettling(true);
    try {
      const res: any = await mobileApiRequest("/waiter/payments/settle", {
        method: "POST",
        body: JSON.stringify({
          table_number: tableNumber,
          order_id: billData.order_id,
          payment_mode: mode,
          amount_paid: billData.grand_total,
          waiter_name: waiter?.name || "Service Steward"
        })
      }, token);

      setShowQRModal(false);
      setShowSplitModal(false);
      Alert.alert(
        "Settlement Completed",
        `Bill ${res.bill_number} marked as PAID via ${mode}.\nTable ${tableNumber} is now freed and available for seating.`,
        [
          {
            text: "Done",
            onPress: () => {
              refreshData();
              navigation.navigate("Tables");
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert("Settlement Error", e.message || "Failed to record payment.");
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="BILL & PAYMENT" subtitle={`Table ${tableNumber} Guest Settlement`} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              fetchTablesAndPending();
              fetchBillPreview();
            }}
            tintColor={COLORS.gold}
          />
        }
      >
        {/* 1. Pending Billing Tables (Tables Awaiting Bill Approval) */}
        {pendingTables.length > 0 ? (
          <View style={styles.pendingSection}>
            <View style={styles.pendingHeaderRow}>
              <Text style={styles.pendingSectionTitle}>TABLES AWAITING BILL ({pendingTables.length})</Text>
              <Text style={styles.pendingSectionSub}>Action Required</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingScroll}>
              {pendingTables.map(pt => (
                <TouchableOpacity
                  key={pt.table_number}
                  style={[
                    styles.pendingCard,
                    tableNumber === pt.table_number && styles.pendingCardActive
                  ]}
                  onPress={() => setTableNumber(pt.table_number)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pendingCardTop}>
                    <Text style={[styles.pendingCardTbl, tableNumber === pt.table_number && styles.textDark]}>
                      Table {pt.table_number}
                    </Text>
                    <Text style={[styles.pendingCardAmt, tableNumber === pt.table_number && styles.textDark]}>
                      ₹{pt.final_amount.toFixed(0)}
                    </Text>
                  </View>
                  <Text style={[styles.pendingCardGuest, tableNumber === pt.table_number && styles.textDarkMuted]} numberOfLines={1}>
                    {pt.customer_name || "Guest"} • {pt.items_count || 1} items
                  </Text>
                  <Text style={[styles.pendingCardStatus, tableNumber === pt.table_number && styles.textDark]}>
                    Tap to Settle →
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyPendingBanner}>
            <Text style={styles.emptyPendingIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyPendingTitle}>All Dining Tables In Good Standing</Text>
              <Text style={styles.emptyPendingSub}>
                No tables currently requesting bill approval. Select any table below to view status or punch a new bill.
              </Text>
            </View>
          </View>
        )}

        {/* 2. All Dynamic Tables Selector */}
        <View style={styles.tablePicker}>
          <Text style={styles.pickerLabel}>ALL OUTLET TABLES ({tablesList.length || 16}):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            {(tablesList.length > 0 ? tablesList.map(t => t.table_number) : [
              "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"
            ]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tablePill, tableNumber === t && styles.tablePillActive]}
                onPress={() => setTableNumber(t)}
              >
                <Text style={[styles.pillText, tableNumber === t && styles.pillTextActive]}>T-{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.gold} style={styles.loader} />
        ) : !billData ? (
          <View style={styles.noBillBox}>
            <View style={styles.noBillIconCircle}>
              <Text style={{ fontSize: 32 }}>🍽️</Text>
            </View>
            <Text style={styles.noBillTitle}>Table {tableNumber} is Available</Text>
            <Text style={styles.noBillSub}>
              Table {tableNumber} currently does not have an active order or is already settled.
            </Text>
            <TouchableOpacity
              style={styles.createOrderBtn}
              onPress={() => navigation.navigate("ManualOrder", { table_number: tableNumber })}
              activeOpacity={0.85}
            >
              <Text style={styles.createOrderBtnText}>+ CREATE NEW ORDER & BILL FOR TABLE {tableNumber}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.invoiceCard}>
            {/* Invoice Header */}
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.publiqTitle}>PUBLIQ BAR &amp; RESTAURANT</Text>
                <Text style={styles.publiqSub}>5% GST Composition Scheme • SAC 996331</Text>
              </View>
              <Text style={styles.invBadge}>PROVISIONAL</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Order: {billData.order_number}</Text>
              <Text style={styles.metaText}>Guest: {billData.customer_name}</Text>
            </View>

            {/* Department Filter Tabs (Dual-Business Support) */}
            {deptBillData && (
              <View style={{ flexDirection: "row", gap: 8, marginVertical: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.discBtn,
                    selectedDeptTab === "ALL" && styles.discBtnActive,
                    { flex: 1, paddingVertical: 8 }
                  ]}
                  onPress={() => setSelectedDeptTab("ALL")}
                >
                  <Text style={[styles.discText, selectedDeptTab === "ALL" && styles.discTextActive]}>
                    ALL ITEMS
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.discBtn,
                    selectedDeptTab === "FOOD" && { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
                    { flex: 1, paddingVertical: 8 }
                  ]}
                  onPress={() => setSelectedDeptTab("FOOD")}
                >
                  <Text style={[styles.discText, selectedDeptTab === "FOOD" && { color: "#070B12", fontWeight: "900" }]}>
                    🍲 FOOD (ANIL)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.discBtn,
                    selectedDeptTab === "BEVERAGE" && { backgroundColor: "#38BDF8", borderColor: "#38BDF8" },
                    { flex: 1, paddingVertical: 8 }
                  ]}
                  onPress={() => setSelectedDeptTab("BEVERAGE")}
                >
                  <Text style={[styles.discText, selectedDeptTab === "BEVERAGE" && { color: "#070B12", fontWeight: "900" }]}>
                    🍸 DRINKS (RAMESH)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Line Items */}
            <View style={styles.itemsBlock}>
              {billData.items && billData.items
                .filter((it: any) => selectedDeptTab === "ALL" || it.department === selectedDeptTab)
                .map((it: any) => (
                  <View key={it.id} style={styles.itemLine}>
                    <Text style={styles.itemQty}>{it.quantity}x</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNameText}>{it.item_name}</Text>
                      {it.department && (
                        <Text style={{ fontSize: 9, color: it.department === "FOOD" ? COLORS.gold : "#38BDF8", fontWeight: "bold" }}>
                          {it.department === "FOOD" ? "FOOD (ANIL)" : "BAR (RAMESH)"}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemPriceText}>₹{it.total_price.toFixed(2)}</Text>
                  </View>
                ))}
            </View>

            {/* Quick Add More Items Button */}
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => navigation.navigate("ManualOrder", { table_number: tableNumber })}
            >
              <Text style={styles.addMoreText}>+ ADD FOOD / DRINKS TO THIS TABLE</Text>
            </TouchableOpacity>

            {/* Discount selector */}
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>Staff Courtesy Discount:</Text>
              <View style={styles.discountPills}>
                {[0, 5, 10, 15].map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.discBtn, discountPct === d && styles.discBtnActive]}
                    onPress={() => setDiscountPct(d)}
                  >
                    <Text style={[styles.discText, discountPct === d && styles.discTextActive]}>{d}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tax & Grand Total Breakdown */}
            <View style={styles.totalBreakdown}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Item Subtotal</Text>
                <Text style={styles.calcVal}>₹{billData.subtotal.toFixed(2)}</Text>
              </View>

              {discountPct > 0 && (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: COLORS.danger }]}>Discount ({discountPct}%)</Text>
                  <Text style={[styles.calcVal, { color: COLORS.danger }]}>-₹{billData.discount_amount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Taxable Value</Text>
                <Text style={styles.calcVal}>₹{billData.taxable_amount.toFixed(2)}</Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>CGST (2.5%)</Text>
                <Text style={styles.calcVal}>₹{billData.cgst.toFixed(2)}</Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>SGST (2.5%)</Text>
                <Text style={styles.calcVal}>₹{billData.sgst.toFixed(2)}</Text>
              </View>

              <View style={[styles.calcRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.grandTotalVal}>₹{billData.grand_total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Payment Methods */}
            <Text style={styles.sectionHeader}>SELECT PAYMENT TENDER</Text>
            <View style={styles.tenderRow}>
              {["UPI", "CASH", "CARD"].map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.tenderBtn, selectedTender === mode && styles.tenderBtnActive]}
                  onPress={() => setSelectedTender(mode)}
                >
                  <Text style={[styles.tenderText, selectedTender === mode && styles.tenderTextActive]}>
                    {mode === "UPI" ? "📱 UPI QR" : mode === "CASH" ? "💵 CASH" : "💳 CARD"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.btnStack}>
              {/* Dual-Business UPI QR Buttons */}
              {deptBillData ? (
                <View style={{ gap: 8, marginBottom: 4 }}>
                  <TouchableOpacity
                    style={[styles.mainActionBtn, { backgroundColor: COLORS.gold }]}
                    onPress={() => handleShowDepartmentQR("FOOD")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.mainActionTextDark}>📱 SHOW FOOD QR (ANIL: ₹{(deptBillData.food_bill?.grand_total || 0).toFixed(2)})</Text>
                    <Text style={styles.mainActionSubDark}>UPI: 8431712924-3@ybl • PhonePe QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.mainActionBtn, { backgroundColor: "#38BDF8" }]}
                    onPress={() => handleShowDepartmentQR("BEVERAGE")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.mainActionTextDark}>📱 SHOW DRINKS QR (RAMESH: ₹{(deptBillData.beverage_bill?.grand_total || 0).toFixed(2)})</Text>
                    <Text style={styles.mainActionSubDark}>UPI: ramesh776059@ybl • PhonePe QR</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.mainActionBtn, { backgroundColor: COLORS.gold }]}
                  onPress={handleGenerateUPIQR}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mainActionTextDark}>GENERATE DYNAMIC UPI QR</Text>
                  <Text style={styles.mainActionSubDark}>Exact Amount: ₹{billData.grand_total.toFixed(2)}</Text>
                </TouchableOpacity>
              )}

              {/* Generate GST Tax Invoice */}
              <TouchableOpacity
                style={[styles.mainActionBtn, { backgroundColor: "#151F33", borderWidth: 1, borderColor: COLORS.gold }]}
                onPress={handleGenerateInvoice}
                disabled={isGeneratingInvoice}
                activeOpacity={0.85}
              >
                <Text style={{ color: COLORS.gold, fontWeight: "bold", fontSize: 13, letterSpacing: 0.5 }}>
                  {isGeneratingInvoice ? "CREATING INVOICE..." : "GENERATE OFFICIAL GST INVOICE"}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>
                  {deptBillData ? "Select Food (Anil) or Drinks (Ramesh) • 5% GST" : "5% GST Tax Receipt with Invoice No"}
                </Text>
              </TouchableOpacity>

              {generatedInvoice && (
                <TouchableOpacity
                  style={[styles.mainActionBtn, { backgroundColor: "#0F2038", borderWidth: 1, borderColor: "#38BDF8" }]}
                  onPress={() => setShowInvoiceModal(true)}
                >
                  <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 12 }}>
                    📄 VIEW / PRINT GST RECEIPT ({generatedInvoice.invoice_number})
                  </Text>
                </TouchableOpacity>
              )}

              {/* Record Settlement Button */}
              <TouchableOpacity
                style={[styles.mainActionBtn, { backgroundColor: COLORS.success }]}
                onPress={() => handleSettlePayment(selectedTender)}
                disabled={isSettling}
                activeOpacity={0.85}
              >
                <Text style={styles.mainActionTextDark}>
                  {isSettling ? "SETTLING..." : `RECORD ${selectedTender} PAYMENT (₹${billData.grand_total.toFixed(2)})`}
                </Text>
                <Text style={styles.mainActionSubDark}>Settle Table &amp; Free Seating</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.splitBtn}
                onPress={() => setShowSplitModal(true)}
              >
                <Text style={styles.splitBtnText}>SPLIT BILL CALCULATOR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Dynamic UPI Payment QR Modal */}
      {showQRModal && qrData && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.qrModalContent}>
              <View style={styles.qrModalHeader}>
                <View>
                  <Text style={styles.qrModalTitle}>
                    {qrData.department === "FOOD"
                      ? "FOOD PAYMENT (ANIL)"
                      : qrData.department === "BEVERAGE"
                      ? "DRINKS PAYMENT (RAMESH)"
                      : "GUEST PAYMENT QR"}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.gold, fontWeight: "bold", marginTop: 2 }}>
                    Exact Amount: ₹{qrData.amount.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowQRModal(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Display official PhonePe QR plaque image if Food or Beverage */}
              {qrData.department === "FOOD" ? (
                <View style={{ alignItems: "center", marginVertical: 8 }}>
                  <Image
                    source={require("../../assets/food_upi_qr.jpg")}
                    style={{ width: 220, height: 260, borderRadius: 12 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: "900", marginTop: 6 }}>
                    ANIL • {qrData.vpa}
                  </Text>
                </View>
              ) : qrData.department === "BEVERAGE" ? (
                <View style={{ alignItems: "center", marginVertical: 8 }}>
                  <Image
                    source={require("../../assets/beverage_upi_qr.jpg")}
                    style={{ width: 220, height: 260, borderRadius: 12 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: "900", marginTop: 6 }}>
                    RAMESH S P • {qrData.vpa}
                  </Text>
                </View>
              ) : (
                <DynamicUPIQR
                  upiString={qrData.upi_string}
                  amount={qrData.amount}
                  vpa={qrData.vpa}
                />
              )}

              <Text style={styles.qrHelper}>
                {qrData.qr_instructions}
              </Text>

              <TouchableOpacity
                style={styles.confirmPaidBtn}
                onPress={() => handleSettlePayment("UPI")}
                disabled={isSettling}
              >
                <Text style={styles.confirmPaidText}>
                  {isSettling ? "RECORDING..." : `✓ GUEST PAID ₹${qrData.amount.toFixed(2)} VIA UPI`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Official Printable GST Invoice Modal */}
      {showInvoiceModal && generatedInvoice && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.invoiceReceiptContent}>
              <View style={styles.invoiceReceiptHeader}>
                <Image
                  source={require("../../assets/logo.png")}
                  style={{ width: 44, height: 44, alignSelf: "center", marginBottom: 6 }}
                  resizeMode="contain"
                />
                <Text style={styles.invoicePubliqTitle}>
                  {generatedInvoice.department === "FOOD"
                    ? "PUBLIQ FOOD & KITCHEN"
                    : generatedInvoice.department === "BEVERAGE"
                    ? "PUBLIQ BAR & BEVERAGES"
                    : "PUBLIQ BAR & RESTAURANT"}
                </Text>
                <Text style={styles.invoiceOutletText}>
                  {generatedInvoice.owner_name ? `Proprietor: ${generatedInvoice.owner_name} • ` : ""}HARAGADDE OUTLET, BANGALORE
                </Text>
                <Text style={styles.invoiceGstinText}>
                  GSTIN: {generatedInvoice.gstin || "29AABCP1234F1Z9"} • SAC: {generatedInvoice.sac_code || "996331"}
                </Text>
                {generatedInvoice.upi_id && (
                  <Text style={[styles.invoiceGstinText, { color: COLORS.gold, fontWeight: "bold", marginTop: 2 }]}>
                    Settlement VPA: {generatedInvoice.upi_id}
                  </Text>
                )}
              </View>

              <View style={styles.invoiceDivider} />

              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Invoice No:</Text>
                <Text style={styles.receiptMetaVal}>{generatedInvoice.invoice_number}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Date &amp; Time:</Text>
                <Text style={styles.receiptMetaVal}>{generatedInvoice.invoice_date || new Date().toLocaleString()}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Table &amp; Guest:</Text>
                <Text style={styles.receiptMetaVal}>Table {generatedInvoice.table_number} • {billData?.customer_name || "Guest"}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Served By:</Text>
                <Text style={styles.receiptMetaVal}>{generatedInvoice.waiter_name || waiter?.name || "Steward"}</Text>
              </View>

              <View style={styles.invoiceDivider} />

              <ScrollView style={{ maxHeight: 160 }}>
                {billData?.items && billData.items.map((it: any) => (
                  <View key={it.id} style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemQty}>{it.quantity}x</Text>
                    <Text style={styles.receiptItemName}>{it.item_name}</Text>
                    <Text style={styles.receiptItemPrice}>₹{it.total_price.toFixed(2)}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.invoiceDivider} />

              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Item Subtotal:</Text>
                <Text style={styles.receiptMetaVal}>₹{generatedInvoice.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>CGST (2.5%):</Text>
                <Text style={styles.receiptMetaVal}>₹{generatedInvoice.cgst.toFixed(2)}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>SGST (2.5%):</Text>
                <Text style={styles.receiptMetaVal}>₹{generatedInvoice.sgst.toFixed(2)}</Text>
              </View>
              <View style={[styles.receiptMetaRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#334155" }]}>
                <Text style={[styles.receiptMetaLabel, { color: COLORS.gold, fontSize: 14, fontWeight: "900" }]}>GRAND TOTAL:</Text>
                <Text style={[styles.receiptMetaVal, { color: COLORS.gold, fontSize: 16, fontWeight: "900" }]}>₹{generatedInvoice.grand_total.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={styles.closeInvoiceBtn}
                onPress={() => setShowInvoiceModal(false)}
              >
                <Text style={styles.closeInvoiceText}>CLOSE INVOICE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Split Bill Modal */}
      {showSplitModal && billData && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.splitModalContent}>
              <Text style={styles.splitTitle}>SPLIT BILL: TABLE {tableNumber}</Text>
              <Text style={styles.splitTotal}>Total Bill: ₹{billData.grand_total.toFixed(2)}</Text>

              <Text style={styles.splitLabel}>Number of Guests:</Text>
              <View style={styles.splitCounter}>
                {[2, 3, 4, 5, 6].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.countPill, splitCount === num && styles.countPillActive]}
                    onPress={() => setSplitCount(num)}
                  >
                    <Text style={[styles.countText, splitCount === num && styles.countTextActive]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.splitResultBox}>
                <Text style={styles.splitPerGuestLabel}>EACH GUEST PAYS:</Text>
                <Text style={styles.splitPerGuestVal}>₹{(billData.grand_total / splitCount).toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={styles.closeSplitBtn}
                onPress={() => setShowSplitModal(false)}
              >
                <Text style={styles.closeSplitText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 50
  },
  pendingSection: {
    marginBottom: 16,
    backgroundColor: "#0B1528",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)"
  },
  pendingHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  pendingSectionTitle: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5
  },
  pendingSectionSub: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: "bold"
  },
  pendingScroll: {
    flexDirection: "row"
  },
  pendingCard: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    minWidth: 140
  },
  pendingCardActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold
  },
  pendingCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  pendingCardTbl: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: 13
  },
  pendingCardAmt: {
    color: COLORS.gold,
    fontWeight: "900",
    fontSize: 13
  },
  pendingCardGuest: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 4
  },
  pendingCardStatus: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: "bold"
  },
  textDark: {
    color: "#070B12"
  },
  textDarkMuted: {
    color: "rgba(7,11,18,0.7)"
  },
  emptyPendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 12
  },
  emptyPendingIcon: {
    fontSize: 18,
    color: COLORS.success,
    fontWeight: "bold"
  },
  emptyPendingTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "bold"
  },
  emptyPendingSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2
  },
  tablePicker: {
    marginBottom: 16
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 8
  },
  pillsScroll: {
    flexDirection: "row"
  },
  tablePill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8
  },
  tablePillActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldMuted
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary
  },
  pillTextActive: {
    color: COLORS.gold,
    fontWeight: "900"
  },
  loader: {
    marginTop: 40
  },
  noBillBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10
  },
  noBillIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  noBillTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.gold
  },
  noBillSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: "center",
    marginBottom: 18
  },
  createOrderBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  createOrderBtnText: {
    color: "#070B12",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5
  },
  invoiceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12
  },
  publiqTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 1
  },
  publiqSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2
  },
  invBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.warning,
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary
  },
  itemsBlock: {
    paddingVertical: 10
  },
  itemLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4
  },
  itemQty: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.gold,
    width: 26
  },
  itemNameText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary
  },
  itemPriceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  addMoreBtn: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    alignItems: "center",
    marginVertical: 8
  },
  addMoreText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceElevated,
    padding: 10,
    borderRadius: 10,
    marginVertical: 10
  },
  discountLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  discountPills: {
    flexDirection: "row",
    gap: 6
  },
  discBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surface
  },
  discBtnActive: {
    backgroundColor: COLORS.gold
  },
  discText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary
  },
  discTextActive: {
    color: "#070B12"
  },
  totalBreakdown: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  calcLabel: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  calcVal: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.gold
  },
  grandTotalVal: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.gold
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8
  },
  tenderRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  tenderBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  tenderBtnActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldMuted
  },
  tenderText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary
  },
  tenderTextActive: {
    color: COLORS.gold
  },
  btnStack: {
    gap: 10
  },
  mainActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  mainActionTextDark: {
    color: "#070B12",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  mainActionSubDark: {
    color: "rgba(7, 11, 18, 0.7)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  },
  splitBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  splitBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 20
  },
  qrModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gold
  },
  qrModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  qrModalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 1
  },
  modalCloseBtn: {
    padding: 6
  },
  modalCloseText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: "700"
  },
  qrHelper: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    marginVertical: 14
  },
  confirmPaidBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  confirmPaidText: {
    color: "#070B12",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  invoiceReceiptContent: {
    backgroundColor: "#070B12",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gold
  },
  invoiceReceiptHeader: {
    alignItems: "center"
  },
  invoicePubliqTitle: {
    color: COLORS.gold,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.5
  },
  invoiceOutletText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  invoiceGstinText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 12
  },
  receiptMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2
  },
  receiptMetaLabel: {
    color: COLORS.textMuted,
    fontSize: 11
  },
  receiptMetaVal: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "600"
  },
  receiptItemRow: {
    flexDirection: "row",
    paddingVertical: 4
  },
  receiptItemQty: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "bold",
    width: 24
  },
  receiptItemName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12
  },
  receiptItemPrice: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  closeInvoiceBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14
  },
  closeInvoiceText: {
    color: "#070B12",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5
  },
  splitModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.gold
  },
  splitTotal: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16
  },
  splitLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 8
  },
  splitCounter: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18
  },
  countPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center"
  },
  countPillActive: {
    backgroundColor: COLORS.gold
  },
  countText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textSecondary
  },
  countTextActive: {
    color: "#070B12",
    fontWeight: "900"
  },
  splitResultBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.gold
  },
  splitPerGuestLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.gold,
    letterSpacing: 1
  },
  splitPerGuestVal: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginTop: 4
  },
  closeSplitBtn: {
    marginTop: 14,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  closeSplitText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  }
});
