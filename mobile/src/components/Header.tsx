import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar as RNStatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onManagerPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onManagerPress }) => {
  const { waiter } = useAuth();
  const insets = useSafeAreaInsets();

  const statusBarOffset = Platform.OS === "android" ? (RNStatusBar.currentHeight || 28) : insets.top;
  const topPadding = Math.max(statusBarOffset, insets.top || 0, 32) + 12;

  const displayTitle = title && title !== "PUBLIQ W" ? title : "PUBLIQ WAITER";

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.left}>
        <View style={styles.brandRow}>
          <View style={styles.logoContainer}>
            <Image 
              source={require("../../assets/logo.png")} 
              style={styles.logoBadge} 
              resizeMode="contain" 
            />
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.brandTitle} numberOfLines={1}>{displayTitle}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle || waiter?.outlet_name || "PUBLIQ HARAGADDE"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        {onManagerPress && (
          <TouchableOpacity style={styles.managerButton} onPress={onManagerPress} activeOpacity={0.8}>
            <Text style={styles.managerText}>CALL MANAGER</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  left: {
    flex: 1
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    alignItems: "center",
    justifyContent: "center",
    padding: 3
  },
  logoBadge: {
    width: "100%",
    height: "100%"
  },
  titleWrap: {
    flex: 1
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 1.5
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  right: {
    flexDirection: "row",
    alignItems: "center"
  },
  managerButton: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.danger,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8
  },
  managerText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  }
});
