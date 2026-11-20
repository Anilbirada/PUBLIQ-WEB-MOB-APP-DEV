import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Modal, TextInput } from "react-native";
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
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [qrData, setQrData] = useState<any | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showSplitModal, setShowSplitModal] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [selectedTender, setSelectedTender] = useState<string>("UPI");
  const [isSettling, setIsSettling] = useState<boolean>(false);

  useEffect(() => {
    fetchBillPreview();
  }, [tableNumber, discountPct]);

  const fetchBillPreview = async () => {
    setLoading(true);
    try {
      const data: any = await mobileApiRequest(
        `/waiter/bills/preview/${tableNumber}?discount_pct=${discountPct}`,
        { method: "GET" },
        token
      );
      setBillData(data);
    } catch (e: any) {
      setBillData(null);
    } finally {
      setLoading(false);
    }
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

      setQrData(res);
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

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Table Selector */}
        <View style={styles.tablePicker}>
          <Text style={styles.pickerLabel}>SELECT TABLE FOR BILLING:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            {["01", "02", "03", "04", "05", "06", "07", "08"].map(t => (
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
            <Text style={styles.noBillTitle}>No Unsettled Order</Text>
            <Text style={styles.noBillSub}>Table {tableNumber} does not have an active order or is already paid.</Text>
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

            {/* Line Items */}
            <View style={styles.itemsBlock}>
              {billData.items && billData.items.map((it: any) => (
                <View key={it.id} style={styles.itemLine}>
                  <Text style={styles.itemQty}>{it.quantity}x</Text>
                  <Text style={styles.itemNameText}>{it.item_name}</Text>
                  <Text style={styles.itemPriceText}>₹{it.total_price.toFixed(2)}</Text>
                </View>
              ))}
            </View>

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
              {selectedTender === "UPI" ? (
                <TouchableOpacity
                  style={[styles.mainActionBtn, { backgroundColor: COLORS.gold }]}
                  onPress={handleGenerateUPIQR}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mainActionTextDark}>GENERATE DYNAMIC UPI QR</Text>
                  <Text style={styles.mainActionSubDark}>Exact Amount: ₹{billData.grand_total.toFixed(2)}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.mainActionBtn, { backgroundColor: COLORS.success }]}
                  onPress={() => handleSettlePayment(selectedTender)}
                  disabled={isSettling}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mainActionTextDark}>{isSettling ? "SETTLING..." : `RECORD ${selectedTender} PAYMENT`}</Text>
                  <Text style={styles.mainActionSubDark}>Collect ₹{billData.grand_total.toFixed(2)} & Free Table</Text>
                </TouchableOpacity>
              )}

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
                <Text style={styles.qrModalTitle}>GUEST PAYMENT QR</Text>
                <TouchableOpacity onPress={() => setShowQRModal(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <DynamicUPIQR
                upiString={qrData.upi_string}
                amount={qrData.amount}
                vpa={qrData.vpa}
              />

              <Text style={styles.qrHelper}>
                {qrData.qr_instructions}
              </Text>

              <TouchableOpacity
                style={styles.confirmPaidBtn}
                onPress={() => handleSettlePayment("UPI")}
                disabled={isSettling}
              >
                <Text style={styles.confirmPaidText}>
                  {isSettling ? "RECORDING..." : "✓ GUEST PAID VIA UPI"}
                </Text>
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
    paddingBottom: 40
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
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20
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
    textAlign: "center"
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
