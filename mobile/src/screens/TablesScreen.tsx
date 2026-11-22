import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, Modal } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";

export const TablesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchTables = async () => {
    try {
      const data: any = await mobileApiRequest("/waiter/tables", { method: "GET" }, token);
      setTables(data || []);
    } catch (e) {
      console.warn("Error fetching tables:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 6000);
    return () => clearInterval(interval);
  }, []);

  const filteredTables = tables.filter(t => {
    if (filterStatus === "OCCUPIED") return t.is_occupied;
    if (filterStatus === "AVAILABLE") return !t.is_occupied;
    if (filterStatus === "BILLING") return t.has_unsettled_order || t.wants_bill;
    return true;
  });

  const renderTableCard = ({ item }: { item: any }) => {
    const isOccupied = item.is_occupied;
    const activeOrder = item.active_order;

    return (
      <TouchableOpacity
        style={[
          styles.tableCard,
          isOccupied && styles.tableCardOccupied,
          activeOrder && { borderColor: COLORS.gold }
        ]}
        onPress={() => setSelectedTable(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.tableNumber}>T-{item.table_number}</Text>
          <Text style={styles.capacityText}>👥 {item.capacity}</Text>
        </View>

        <View style={styles.statusRow}>
          <StatusBadge status={item.status} />
        </View>

        {activeOrder ? (
          <View style={styles.orderSummary}>
            <Text style={styles.guestName} numberOfLines={1}>{activeOrder.customer_name}</Text>
            <Text style={styles.orderAmount}>₹{activeOrder.final_amount.toFixed(0)}</Text>
            <Text style={styles.itemsCount}>{activeOrder.items_count} items</Text>
          </View>
        ) : (
          <View style={styles.emptyTable}>
            <Text style={styles.emptyText}>Available for Guests</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="TABLE FLOOR PLAN" subtitle="Live Dining Room & Garden Area" />

      {/* Filter Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, gap: 8, flexWrap: "wrap" }}>
        {[
          { label: `ALL (${tables.length})`, val: "ALL" },
          { label: `OCCUPIED (${tables.filter(t => t.is_occupied).length})`, val: "OCCUPIED" },
          { label: `BILLING (${tables.filter(t => t.has_unsettled_order || t.wants_bill).length})`, val: "BILLING" },
          { label: `AVAILABLE (${tables.filter(t => !t.is_occupied).length})`, val: "AVAILABLE" }
        ].map(f => (
          <TouchableOpacity
            key={f.val}
            style={{
              backgroundColor: filterStatus === f.val ? COLORS.gold : COLORS.surface,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: filterStatus === f.val ? COLORS.gold : COLORS.border
            }}
            onPress={() => setFilterStatus(f.val)}
          >
            <Text style={{
              color: filterStatus === f.val ? "#070B12" : COLORS.textSecondary,
              fontSize: 11,
              fontWeight: "bold"
            }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.container}>
        <FlatList
          data={filteredTables}
          keyExtractor={item => item.id || item.table_number}
          renderItem={renderTableCard}
          numColumns={2}
          contentContainerStyle={[styles.listContent, { paddingBottom: 40 }]}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTables} tintColor={COLORS.gold} />}
        />
      </View>

      {/* Table Quick Actions Modal */}
      {selectedTable && (
        <Modal
          visible={!!selectedTable}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedTable(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedTable(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTableNum}>TABLE {selectedTable.table_number}</Text>
                  <Text style={styles.modalCapacity}>Capacity: {selectedTable.capacity} Seats • Status: {selectedTable.status}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTable(null)} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedTable.active_order ? (
                <View style={styles.activeOrderBox}>
                  <Text style={styles.boxLabel}>CURRENT DINE-IN SESSION</Text>
                  <Text style={styles.orderNum}>Order: {selectedTable.active_order.order_number}</Text>
                  <Text style={styles.guestDetail}>Guest: {selectedTable.active_order.customer_name}</Text>
                  <Text style={styles.amountLarge}>₹{selectedTable.active_order.final_amount.toFixed(2)}</Text>
                </View>
              ) : (
                <Text style={styles.noOrderMsg}>No active order placed for this table yet.</Text>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: COLORS.gold }]}
                  onPress={() => {
                    const tbl = selectedTable.table_number;
                    setSelectedTable(null);
                    navigation.navigate("ManualOrder", { table_number: tbl });
                  }}
                >
                  <Text style={styles.modalBtnTextDark}>+ ADD FOOD / DRINKS</Text>
                </TouchableOpacity>

                {selectedTable.active_order && (
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.gold, borderWidth: 1 }]}
                    onPress={() => {
                      const tbl = selectedTable.table_number;
                      setSelectedTable(null);
                      navigation.navigate("BillPayment", { table_number: tbl });
                    }}
                  >
                    <Text style={styles.modalBtnTextGold}>GENERATE INVOICE & UPI QR</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
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
    flex: 1,
    padding: 12
  },
  listContent: {
    paddingBottom: 24
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12
  },
  tableCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    minHeight: 140,
    justifyContent: "space-between"
  },
  tableCardOccupied: {
    backgroundColor: COLORS.surfaceElevated
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary
  },
  capacityText: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  statusRow: {
    marginVertical: 8
  },
  orderSummary: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8
  },
  guestName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.gold,
    marginTop: 2
  },
  itemsCount: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  emptyTable: {
    paddingTop: 8
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.borderGold
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  modalTableNum: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.gold
  },
  modalCapacity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: "700"
  },
  activeOrderBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18
  },
  boxLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.gold,
    letterSpacing: 1
  },
  orderNum: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4
  },
  guestDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  amountLarge: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginTop: 8
  },
  noOrderMsg: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginVertical: 14
  },
  modalActions: {
    gap: 10
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  modalBtnTextDark: {
    color: "#070B12",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  modalBtnTextGold: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5
  }
});
