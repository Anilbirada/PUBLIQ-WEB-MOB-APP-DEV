import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, ScrollView } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { getApiBase, setCustomApiBase } from "../config/api";

export const ProfileScreen: React.FC = () => {
  const { waiter, logout } = useAuth();
  const [apiHost, setApiHost] = useState<string>(getApiBase());

  const handleSaveApi = () => {
    setCustomApiBase(apiHost);
    Alert.alert("API Endpoint Updated", `Active backend URL set to:\n${apiHost}`);
  };

  const handleLogout = () => {
    Alert.alert(
      "End Steward Shift",
      "Are you sure you want to log out of this terminal?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="STEWARD PROFILE" subtitle="Operations & Shift Information" />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{waiter?.name?.charAt(0) || "W"}</Text>
          </View>
          <Text style={styles.waiterName}>{waiter?.name || "Service Steward"}</Text>
          <Text style={styles.waiterRole}>ROLE: {waiter?.role || "WAITER"}</Text>
          <Text style={styles.outlet}>{waiter?.outlet_name || "PUBLIQ Flagship (Indiranagar)"}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>Active</Text>
              <Text style={styles.statLbl}>Shift Status</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>16</Text>
              <Text style={styles.statLbl}>Floor Tables</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>5%</Text>
              <Text style={styles.statLbl}>GST Mode</Text>
            </View>
          </View>
        </View>

        {/* Backend Configuration */}
        <View style={styles.configCard}>
          <Text style={styles.configHeading}>BACKEND CONNECTION CONFIG</Text>
          <Text style={styles.configSub}>Adjust for Android emulator (10.0.2.2), local LAN IP, or Render cloud:</Text>

          <TextInput
            style={styles.apiInput}
            value={apiHost}
            onChangeText={setApiHost}
            placeholder="http://10.0.2.2:8001/api/v1"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApi}>
            <Text style={styles.saveBtnText}>SAVE API ENDPOINT</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>END SHIFT &amp; LOGOUT</Text>
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
    paddingBottom: 40
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gold,
    marginBottom: 16
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.goldMuted,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.gold
  },
  waiterName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary
  },
  waiterRole: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.gold,
    letterSpacing: 1,
    marginTop: 2
  },
  outlet: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    marginTop: 16,
    width: "100%",
    justifyContent: "space-around"
  },
  statCol: {
    alignItems: "center"
  },
  statVal: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary
  },
  statLbl: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2
  },
  configCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20
  },
  configHeading: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.textMuted,
    letterSpacing: 1
  },
  configSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginVertical: 8
  },
  apiInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    color: COLORS.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10
  },
  saveBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderGold,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center"
  },
  saveBtnText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "800"
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.danger,
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center"
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5
  }
});
