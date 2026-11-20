import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useLiveSync } from "../context/LiveSyncContext";

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { waiter } = useAuth();
  const { metrics, refreshData, isRefreshing } = useLiveSync();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header subtitle={`${waiter?.name} (${waiter?.role})`} onManagerPress={() => navigation.navigate("CallManager")} />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} tintColor={COLORS.gold} />}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeGreeting}>Operational Steward Shift Active</Text>
          <Text style={styles.outletName}>{waiter?.outlet_name || "PUBLIQ Flagship (Indiranagar)"}</Text>
          <Text style={styles.shiftMeta}>5% GST Composition Mode Active • Live POS & KDS Sync</Text>
        </View>

        {/* Urgent Action Alert: QR Orders Awaiting Approval */}
        {metrics.pending_approval > 0 && (
          <TouchableOpacity
            style={styles.actionAlert}
            onPress={() => navigation.navigate("QROrders")}
            activeOpacity={0.85}
          >
            <View style={styles.alertLeft}>
              <View style={styles.alertPulse} />
              <View>
                <Text style={styles.alertTitle}>{metrics.pending_approval} New Customer QR Orders</Text>
                <Text style={styles.alertSubtitle}>Review and approve to dispatch to Kitchen & Bar</Text>
              </View>
            </View>
            <Text style={styles.alertAction}>REVIEW →</Text>
          </TouchableOpacity>
        )}

        {/* Operational Metrics Cards */}
        <Text style={styles.sectionHeader}>FLOOR & SERVICE OVERVIEW</Text>
        <View style={styles.grid}>
          {/* My Tables */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate("Tables")}
            activeOpacity={0.8}
          >
            <Text style={styles.metricNumber}>{metrics.occupied_tables}/{metrics.total_tables}</Text>
            <Text style={styles.metricLabel}>Tables Seated</Text>
            <Text style={styles.metricSub}>{metrics.available_tables} Available</Text>
          </TouchableOpacity>

          {/* Pending Approval */}
          <TouchableOpacity
            style={[styles.metricCard, metrics.pending_approval > 0 && styles.metricCardActive]}
            onPress={() => navigation.navigate("QROrders")}
            activeOpacity={0.8}
          >
            <Text style={[styles.metricNumber, { color: metrics.pending_approval > 0 ? COLORS.warning : COLORS.textPrimary }]}>
              {metrics.pending_approval}
            </Text>
            <Text style={styles.metricLabel}>QR Approvals</Text>
            <Text style={styles.metricSub}>Action Required</Text>
          </TouchableOpacity>

          {/* Kitchen / Bar Preparing */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate("Tracking")}
            activeOpacity={0.8}
          >
            <Text style={[styles.metricNumber, { color: COLORS.info }]}>{metrics.preparing_orders}</Text>
            <Text style={styles.metricLabel}>Preparing</Text>
            <Text style={styles.metricSub}>Kitchen & Bar</Text>
          </TouchableOpacity>

          {/* Ready to Serve */}
          <TouchableOpacity
            style={[styles.metricCard, metrics.ready_to_serve > 0 && { borderColor: COLORS.success }]}
            onPress={() => navigation.navigate("Tracking")}
            activeOpacity={0.8}
          >
            <Text style={[styles.metricNumber, { color: COLORS.success }]}>{metrics.ready_to_serve}</Text>
            <Text style={styles.metricLabel}>Ready to Serve</Text>
            <Text style={styles.metricSub}>Hot & Cold Pickups</Text>
          </TouchableOpacity>
        </View>

        {/* Fast Action Buttons */}
        <Text style={styles.sectionHeader}>SERVICE ACTIONS</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: COLORS.gold }]}
            onPress={() => navigation.navigate("ManualOrder")}
            activeOpacity={0.85}
          >
            <Text style={styles.bigButtonTextDark}>+ NEW ORDER</Text>
            <Text style={styles.bigButtonSubDark}>Direct Table Punch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.borderGold, borderWidth: 1 }]}
            onPress={() => navigation.navigate("QRScanner")}
            activeOpacity={0.85}
          >
            <Text style={styles.bigButtonTextGold}>SCAN TABLE QR</Text>
            <Text style={styles.bigButtonSubGold}>Verify Physical Table</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Settlement Tile */}
        <TouchableOpacity
          style={styles.billingBanner}
          onPress={() => navigation.navigate("Tables")}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.billingTitle}>{metrics.pending_bills} Tables Awaiting Settlement</Text>
            <Text style={styles.billingSub}>Generate exact amount UPI QR or record cash/card tender</Text>
          </View>
          <Text style={styles.billingArrow}>VIEW →</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 30
  },
  welcomeBanner: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16
  },
  welcomeGreeting: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.gold,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  outletName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2
  },
  shiftMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4
  },
  actionAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warning,
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  alertPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.warning
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.warning
  },
  alertSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  alertAction: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.warning
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 6
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  metricCardActive: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningBg
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textPrimary
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 4
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16
  },
  bigButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  bigButtonTextDark: {
    color: "#070B12",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  bigButtonSubDark: {
    color: "rgba(7, 11, 18, 0.7)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  },
  bigButtonTextGold: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  bigButtonSubGold: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2
  },
  billingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceElevated,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6
  },
  billingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary
  },
  billingSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: 260
  },
  billingArrow: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.gold
  }
});
