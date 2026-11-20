import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";

export const CallManagerModal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token, waiter } = useAuth();
  const [tableNumber, setTableNumber] = useState<string>("01");
  const [reason, setReason] = useState<string>("VIP Guest assistance requested");
  const [isCalling, setIsCalling] = useState<boolean>(false);

  const reasons = [
    "VIP Guest assistance requested",
    "Special sommelier pairing query",
    "Staff discount / comp approval",
    "Guest allergy / culinary query",
    "Billing discrepancy inquiry"
  ];

  const handleSendAlert = async () => {
    setIsCalling(true);
    try {
      await mobileApiRequest("/waiter/service/call-manager", {
        method: "POST",
        body: JSON.stringify({
          table_number: tableNumber,
          waiter_name: waiter?.name || "Service Steward",
          reason
        })
      }, token);

      Alert.alert(
        "Manager Notified",
        `Duty Manager has received an urgent notification for Table ${tableNumber}.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert("Alert Failed", e.message || "Could not dispatch alert.");
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="CALL MANAGER" subtitle="Immediate Duty Escalation" />

      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>TABLE NUMBER:</Text>
          <TextInput
            style={styles.input}
            value={tableNumber}
            onChangeText={setTableNumber}
            placeholder="01"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>REASON FOR CALL:</Text>
          {reasons.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonPill, reason === r && styles.reasonPillActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.customInput}
            value={reason}
            onChangeText={setReason}
            placeholder="Or type custom escalation note"
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendAlert}
            disabled={isCalling}
          >
            <Text style={styles.sendBtnText}>{isCalling ? "NOTIFYING..." : "DISPATCH MANAGER ALERT"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
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
    padding: 16,
    justifyContent: "space-between"
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.danger
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    color: COLORS.textPrimary,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8
  },
  reasonPill: {
    backgroundColor: COLORS.surfaceElevated,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6
  },
  reasonPillActive: {
    borderColor: COLORS.danger,
    borderWidth: 1,
    backgroundColor: COLORS.dangerBg
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  reasonTextActive: {
    color: COLORS.danger,
    fontWeight: "700"
  },
  customInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    color: COLORS.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
    marginBottom: 16
  },
  sendBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: "center"
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700"
  }
});
