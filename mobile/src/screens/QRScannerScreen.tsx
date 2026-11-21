import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";

export const QRScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data: any = await mobileApiRequest("/waiter/tables", { method: "GET" }, token);
      if (Array.isArray(data)) setTables(data);
    } catch (_) {}
  };

  const handleVerify = async (tokenString: string) => {
    if (!tokenString.trim()) {
      Alert.alert("Input Required", "Please enter or scan a table QR token.");
      return;
    }

    setIsVerifying(true);
    try {
      const res: any = await mobileApiRequest("/waiter/qr/verify-table", {
        method: "POST",
        body: JSON.stringify({ token: tokenString.trim() })
      }, token);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}

      Alert.alert(
        `Table ${res.table_number} Verified`,
        `Section: ${res.section || "Dining Floor"}\nCapacity: 👥 ${res.capacity} Guests\nStatus: ${res.status_label || (res.is_occupied ? "OCCUPIED" : "AVAILABLE")}${res.active_order ? `\nActive Order: ${res.active_order.order_number} (₹${res.active_order.final_amount})` : ""}`,
        [
          {
            text: "Take Order (+POS)",
            onPress: () => navigation.navigate("ManualOrder", { table_number: res.table_number })
          },
          {
            text: "Billing & Settle",
            onPress: () => navigation.navigate("MainTabs", { screen: "BillPayment", params: { table_number: res.table_number } })
          },
          {
            text: "Scan Another",
            style: "cancel",
            onPress: () => setScanned(false)
          }
        ]
      );
    } catch (e: any) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (_) {}
      Alert.alert("Invalid QR", e.message || "This table token is expired or unauthorized.", [
        { text: "OK", onPress: () => setScanned(false) }
      ]);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || isVerifying) return;
    setScanned(true);

    let clean = (data || "").trim();
    if (clean.includes("?table=")) {
      const m = clean.match(/[?&]table=([^&]+)/);
      if (m) clean = m[1];
    } else if (clean.includes("/order/")) {
      clean = clean.split("/order/")[1].split("?")[0].split("/")[0];
    }
    handleVerify(clean);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="TABLE QR SCANNER" subtitle="Physical Table Token Verification" />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Camera Viewfinder */}
        <View style={styles.viewfinderCard}>
          {!permission ? (
            <View style={styles.camCenter}>
              <ActivityIndicator size="large" color={COLORS.gold} />
              <Text style={styles.camText}>Initializing Camera...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.camCenter}>
              <Text style={styles.camTitle}>Camera Access Required</Text>
              <Text style={styles.camSub}>Allow camera permission to scan physical table QR plaques.</Text>
              <TouchableOpacity style={styles.allowBtn} onPress={requestPermission} activeOpacity={0.85}>
                <Text style={styles.allowBtnText}>ALLOW CAMERA</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"]
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />

              {/* Glowing Luxury Reticle */}
              <View style={styles.reticleOverlay} pointerEvents="none">
                <View style={styles.reticle}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  {isVerifying ? (
                    <ActivityIndicator size="large" color={COLORS.gold} />
                  ) : (
                    <Text style={styles.scannerPrompt}>
                      {scanned ? "Processing QR..." : "Align Table QR Code Inside Reticle"}
                    </Text>
                  )}
                </View>
              </View>

              {scanned && !isVerifying && (
                <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                  <Text style={styles.rescanText}>TAP TO SCAN AGAIN</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Quick Physical Table Keypad / Selector */}
        <View style={styles.manualCard}>
          <Text style={styles.cardHeading}>SELECT PHYSICAL TABLE (DIRECT KEYPAD)</Text>
          <Text style={styles.cardSub}>Tap any registered floor table to verify instantly:</Text>

          <View style={styles.tableGrid}>
            {(tables.length > 0 ? tables : [
              { table_number: "01" }, { table_number: "02" }, { table_number: "03" }, { table_number: "04" },
              { table_number: "05" }, { table_number: "06" }, { table_number: "07" }, { table_number: "08" }
            ]).map((t: any) => (
              <TouchableOpacity
                key={t.table_number}
                style={styles.tableChip}
                onPress={() => handleVerify(t.table_number)}
                disabled={isVerifying}
                activeOpacity={0.7}
              >
                <Text style={styles.tableChipText}>T-{t.table_number}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Token or Table Number Input */}
          <Text style={[styles.cardHeading, { marginTop: 14 }]}>OR ENTER TOKEN MANUALLY</Text>
          <TextInput
            style={styles.tokenInput}
            value={manualToken}
            onChangeText={setManualToken}
            placeholder="e.g. tbl_tok_991823a or 04"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={() => handleVerify(manualToken)}
            disabled={isVerifying}
            activeOpacity={0.85}
          >
            <Text style={styles.verifyBtnText}>{isVerifying ? "VERIFYING..." : "VERIFY TABLE TOKEN"}</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 40
  },
  viewfinderCard: {
    height: 300,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    marginBottom: 16
  },
  cameraWrapper: {
    flex: 1,
    position: "relative"
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 11, 18, 0.35)"
  },
  reticle: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: COLORS.gold
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10
  },
  scannerPrompt: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    maxWidth: 160,
    backgroundColor: "rgba(7, 11, 18, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  rescanBtn: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  rescanText: {
    color: "#070B12",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.5
  },
  camCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  camTitle: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6
  },
  camSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginBottom: 14
  },
  camText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8
  },
  allowBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12
  },
  allowBtnText: {
    color: "#070B12",
    fontWeight: "bold",
    fontSize: 12
  },
  manualCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 1
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginVertical: 6
  },
  tableGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8
  },
  tableChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  tableChipText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "bold"
  },
  tokenInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 13,
    marginBottom: 12
  },
  verifyBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  verifyBtnText: {
    color: "#070B12",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5
  }
});
