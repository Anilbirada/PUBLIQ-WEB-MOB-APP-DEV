import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, Alert, Modal, TextInput } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useLiveSync } from "../context/LiveSyncContext";

export const QROrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token, waiter } = useAuth();
  const { refreshData } = useLiveSync();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("Item currently 86'd / unavailable");

  const fetchPendingOrders = async () => {
    try {
      const data: any = await mobileApiRequest("/waiter/orders/pending-approval", { method: "GET" }, token);
      setOrders(data || []);
    } catch (e) {
      console.warn("Error fetching pending QR orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptOrder = async (order: any) => {
    try {
      await mobileApiRequest(`/waiter/orders/${order.order_id}/accept`, {
        method: "POST",
        body: JSON.stringify({ waiter_name: waiter?.name || "Service Steward" })
      }, token);

      Alert.alert("Order Dispatched", `Order ${order.order_number} sent to Kitchen and Bar stations.`);
      fetchPendingOrders();
      refreshData();
    } catch (e: any) {
      Alert.alert("Action Failed", e.message || "Failed to accept order.");
    }
  };

  const confirmRejectOrder = async () => {
    if (!rejectingOrder) return;
    try {
      await mobileApiRequest(`/waiter/orders/${rejectingOrder.order_id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          waiter_name: waiter?.name || "Service Steward",
          reason: rejectReason
        })
      }, token);

      Alert.alert("Order Rejected", `Order ${rejectingOrder.order_number} has been rejected.`);
      setRejectingOrder(null);
      fetchPendingOrders();
      refreshData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to reject order.");
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.tableTag}>TABLE {item.table_number}</Text>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
        </View>
        <Text style={styles.orderAmount}>₹{item.final_amount.toFixed(2)}</Text>
      </View>

      <Text style={styles.guestInfo}>
        Guest: {item.customer_name} {item.customer_phone ? `• ${item.customer_phone}` : ""}
      </Text>

      {item.special_instructions ? (
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>Note: {item.special_instructions}</Text>
        </View>
      ) : null}

      {/* Food Section */}
      {item.food_items && item.food_items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>🍳 KITCHEN DISHES ({item.food_items.length})</Text>
          {item.food_items.map((fi: any) => (
            <View key={fi.id} style={styles.itemRow}>
              <Text style={styles.qtyBadge}>{fi.quantity}x</Text>
              <Text style={styles.itemName}>{fi.item_name} {fi.variant_name ? `(${fi.variant_name})` : ""}</Text>
              <Text style={styles.itemPrice}>₹{fi.total_price.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bar Section */}
      {item.bar_items && item.bar_items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>🍸 BAR & COCKTAILS ({item.bar_items.length})</Text>
          {item.bar_items.map((bi: any) => (
            <View key={bi.id} style={styles.itemRow}>
              <Text style={[styles.qtyBadge, { backgroundColor: COLORS.infoBg, color: COLORS.info }]}>{bi.quantity}x</Text>
              <Text style={styles.itemName}>{bi.item_name} {bi.variant_name ? `(${bi.variant_name})` : ""}</Text>
              <Text style={styles.itemPrice}>₹{bi.total_price.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => setRejectingOrder(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectBtnText}>REJECT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAcceptOrder(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptBtnText}>ACCEPT &amp; SEND TO KDS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="QR ORDERS" subtitle="Diner Self-Service Inbound Queue" />

      <FlatList
        data={orders}
        keyExtractor={item => item.order_id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPendingOrders} tintColor={COLORS.gold} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Queue Clear</Text>
            <Text style={styles.emptySub}>No customer QR orders currently waiting for approval.</Text>
          </View>
        }
      />

      {/* Rejection Modal */}
      {rejectingOrder && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalHeading}>Reject Order {rejectingOrder.order_number}?</Text>
              <Text style={styles.modalSub}>Select or specify the operational reason:</Text>

              {["Item currently 86'd / unavailable", "Kitchen peak capacity", "Guest requested cancellation"].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonOption, rejectReason === r && styles.reasonOptionActive]}
                  onPress={() => setRejectReason(r)}
                >
                  <Text style={[styles.reasonText, rejectReason === r && styles.reasonTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}

              <TextInput
                style={styles.reasonInput}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Or enter custom reason"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.modalBtnsRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectingOrder(null)}>
                  <Text style={styles.modalCancelText}>BACK</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalConfirm} onPress={confirmRejectOrder}>
                  <Text style={styles.modalConfirmText}>CONFIRM REJECTION</Text>
                </TouchableOpacity>
              </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 30
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  tableTag: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.gold
  },
  orderNumber: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: "monospace"
  },
  orderAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary
  },
  guestInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6
  },
  instructionBox: {
    backgroundColor: COLORS.surfaceElevated,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning
  },
  instructionText: {
    fontSize: 11,
    color: COLORS.warning
  },
  itemsSection: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 6
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3
  },
  qtyBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.gold,
    backgroundColor: COLORS.goldMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary
  },
  itemPrice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.danger,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  rejectBtnText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  acceptBtnText: {
    color: "#070B12",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.gold
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 240
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 24
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 10
  },
  reasonOption: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    marginBottom: 6
  },
  reasonOptionActive: {
    borderColor: COLORS.danger,
    borderWidth: 1
  },
  reasonText: {
    color: COLORS.textSecondary,
    fontSize: 12
  },
  reasonTextActive: {
    color: COLORS.danger,
    fontWeight: "700"
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: COLORS.textPrimary,
    fontSize: 12,
    marginTop: 8
  },
  modalBtnsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16
  },
  modalCancel: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  },
  modalConfirm: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.danger
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800"
  }
});
