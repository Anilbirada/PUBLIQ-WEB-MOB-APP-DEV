import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onManagerPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = "PUBLIQ W", subtitle, onManagerPress }) => {
  const { waiter } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.brandRow}>
          <Image 
            source={require("../../assets/logo.png")} 
            style={styles.logoBadge} 
            resizeMode="contain" 
          />
          <Text style={styles.brandTitle}>P U B L I Q   W</Text>
        </View>
        <Text style={styles.subtitle}>{subtitle || waiter?.outlet_name || "Enterprise Operations"}</Text>
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
    paddingTop: 14,
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
    gap: 8
  },
  logoBadge: {
    width: 26,
    height: 26
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 2
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
    paddingVertical: 6,
    borderRadius: 8
  },
  managerText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  }
});
