import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, Alert } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useLiveSync } from "../context/LiveSyncContext";

export const OrderTrackingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token, waiter } = useAuth();
  const { refreshData } = useLiveSync();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveOrders = async () => {
    try {
      const data: any = await mobileApiRequest("/waiter/orders/live-prep", { method: "GET" }, token);
      setOrders(data || []);
    } catch (e) {
      console.warn("Error fetching live tracking:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkServed = async (order: any) => {
    try {
      await mobileApiRequest(`/waiter/orders/${order.order_id}/serve`, {
        method: "POST",
        body: JSON.stringify({ waiter_name: waiter?.name || "Service Steward" })
      }, token);

      Alert.alert("Order Served", `Table ${order.table_number} marked as served. Ready for billing.`);
      fetchLiveOrders();
      refreshData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update serving status.");
    }
  };

  const renderTrackCard = ({ item }: { item: any }) => {
    const isDelayed = item.is_delayed;
    const isReady = item.status === "READY";

    return (
      <View style={[styles.trackCard, isReady && styles.readyBorder, isDelayed && styles.delayedBorder]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.tableNum}>TABLE {item.table_number}</Text>
            <Text style={styles.orderNum}>{item.order_number}</Text>
          </View>

          <View style={styles.timerBox}>
            <Text style={[styles.timerText, isDelayed && { color: COLORS.danger }]}>
              ⏱ {item.elapsed_minutes}m elapsed
            </Text>
            <StatusBadge status={item.status} />
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.prepRow}>
          <View style={styles.prepCol}>
            <Text style={styles.prepLabel}>🍳 KITCHEN KDS</Text>
            <Text style={styles.prepVal}>{item.food_status}</Text>
          </View>

          <View style={styles.prepCol}>
            <Text style={styles.prepLabel}>🍸 BAR DISPENSE</Text>
            <Text style={styles.prepVal}>{item.beverage_status}</Text>
          </View>
        </View>

        {/* Item List */}
        <View style={styles.itemList}>
          {item.items && item.items.map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.qty}>{it.quantity}x</Text>
              <Text style={styles.itemName}>{it.item_name}</Text>
              <Text style={styles.stationBadge}>{it.station === "BAR" ? "BAR" : "KITCHEN"}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.billShortcutBtn}
            onPress={() => navigation.navigate("BillPayment", { table_number: item.table_number })}
            activeOpacity={0.8}
          >
            <Text style={styles.billShortcutText}>VIEW BILL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.markServedBtn}
            onPress={() => handleMarkServed(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.markServedText}>✓ MARK SERVED</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="LIVE KDS & BAR TRACKER" subtitle="Order Prep & Serving Coordination" />

      <FlatList
        data={orders}
        keyExtractor={item => item.order_id}
        renderItem={renderTrackCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLiveOrders} tintColor={COLORS.gold} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Kitchen & Bar Clear</Text>
            <Text style={styles.emptySub}>All orders are served or no tables are currently cooking.</Text>
          </View>
        }
      />
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
  trackCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16
  },
  readyBorder: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.surfaceElevated
  },
  delayedBorder: {
    borderColor: COLORS.danger
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  tableNum: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.gold
  },
  orderNum: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: "monospace"
  },
  timerBox: {
    alignItems: "flex-end",
    gap: 4
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary
  },
  prepRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    padding: 8,
    marginVertical: 10
  },
  prepCol: {
    flex: 1
  },
  prepLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5
  },
  prepVal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2
  },
  itemList: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4
  },
  qty: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.gold,
    width: 26
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary
  },
  stationBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  billShortcutBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  billShortcutText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  },
  markServedBtn: {
    flex: 2,
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  markServedText: {
    color: "#070B12",
    fontSize: 12,
    fontWeight: "900"
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
    textAlign: "center"
  }
});
