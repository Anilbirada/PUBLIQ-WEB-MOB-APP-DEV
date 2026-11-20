import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = COLORS.warningBg;
  let textColor = COLORS.warning;
  let label = status.replace(/_/g, " ");

  switch (status.toUpperCase()) {
    case "AVAILABLE":
      bgColor = COLORS.successBg;
      textColor = COLORS.success;
      break;
    case "OCCUPIED":
    case "ORDER_PENDING":
    case "PLACED":
      bgColor = COLORS.warningBg;
      textColor = COLORS.warning;
      break;
    case "PREPARING":
    case "ACCEPTED":
      bgColor = COLORS.infoBg;
      textColor = COLORS.info;
      break;
    case "READY":
    case "READY_TO_SERVE":
      bgColor = COLORS.successBg;
      textColor = COLORS.success;
      break;
    case "SERVED":
    case "BILLING":
      bgColor = COLORS.goldMuted;
      textColor = COLORS.gold;
      break;
    case "PAID":
      bgColor = COLORS.successBg;
      textColor = COLORS.success;
      break;
    case "CANCELLED":
    case "REJECTED":
      bgColor = COLORS.dangerBg;
      textColor = COLORS.danger;
      break;
    default:
      bgColor = COLORS.surfaceElevated;
      textColor = COLORS.textSecondary;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start"
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  }
});
