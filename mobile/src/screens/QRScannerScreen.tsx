import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";

export const QRScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const [manualToken, setManualToken] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

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

      Alert.alert(
        "Table Verified",
        `Confirmed: Table ${res.table_number}\nStatus: Active session enabled.`,
        [
          {
            text: "Open Table",
            onPress: () => {
              navigation.navigate("Tables");
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert("Invalid QR", e.message || "This table token is expired or unauthorized.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="TABLE QR SCANNER" subtitle="Physical Table Token Verification" />

      <View style={styles.container}>
        {/* Camera Viewfinder Mock / Frame */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <Text style={styles.scannerPrompt}>Align Table QR Code Inside Frame</Text>
          </View>
        </View>

        {/* Manual Fallback Verification */}
        <View style={styles.manualCard}>
          <Text style={styles.cardHeading}>MANUAL TOKEN VERIFICATION</Text>
          <Text style={styles.cardSub}>If camera is unavailable or code is smudged, enter token directly:</Text>

          <TextInput
            style={styles.tokenInput}
            value={manualToken}
            onChangeText={setManualToken}
            placeholder="e.g. tbl_tok_991823a or 01"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={() => handleVerify(manualToken)}
            disabled={isVerifying}
          >
            <Text style={styles.verifyBtnText}>{isVerifying ? "VERIFYING..." : "VERIFY TABLE TOKEN"}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: 20,
    justifyContent: "space-between"
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    backgroundColor: "rgba(15, 22, 38, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: COLORS.gold
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12
  },
  scannerPrompt: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: 160
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
