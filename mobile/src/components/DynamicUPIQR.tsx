import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { COLORS } from "../theme/colors";

interface DynamicUPIQRProps {
  upiString: string;
  amount: number;
  vpa: string;
}

// Generate simple visual matrix representation for UPI payload
function generateMatrix(input: string, size: number = 25): boolean[][] {
  const matrix: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      // Corner alignment squares
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= size - 7;
      const isBottomLeft = r >= size - 7 && c < 7;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const inBorder = (r === 0 || r === 6 || c === 0 || c === 6 ||
                         r === size - 1 || r === size - 7 || c === size - 1 || c === size - 7);
        const inCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
                         (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3) ||
                         (r >= size - 5 && r >= size - 3 && c >= 2 && c <= 4);
        row.push(inBorder || inCenter);
      } else {
        const bit = ((hash ^ (r * 31 + c * 17)) & (1 << ((r + c) % 8))) !== 0;
        row.push(bit);
      }
    }
    matrix.push(row);
  }
  return matrix;
}

export const DynamicUPIQR: React.FC<DynamicUPIQRProps> = ({ upiString, amount, vpa }) => {
  const size = 25;
  const matrix = generateMatrix(upiString, size);
  const cellSize = 8;
  const svgDimension = size * cellSize;

  return (
    <View style={styles.card}>
      <Text style={styles.vpaLabel}>SCAN TO PAY WITH ANY UPI APP</Text>
      <Text style={styles.amountText}>₹{amount.toFixed(2)}</Text>

      <View style={styles.qrWrapper}>
        <Svg width={svgDimension} height={svgDimension} viewBox={`0 0 ${svgDimension} ${svgDimension}`}>
          <Rect x="0" y="0" width={svgDimension} height={svgDimension} fill="#FFFFFF" />
          {matrix.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <Rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="#000000"
                />
              ) : null
            )
          )}
        </Svg>
      </View>

      <Text style={styles.vpaSub}>{vpa}</Text>
      <View style={styles.appRow}>
        <Text style={styles.appBadge}>GPay</Text>
        <Text style={styles.appBadge}>PhonePe</Text>
        <Text style={styles.appBadge}>Paytm</Text>
        <Text style={styles.appBadge}>BHIM</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gold
  },
  vpaLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.gold,
    letterSpacing: 1,
    marginBottom: 6
  },
  amountText: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 16
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  vpaSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "monospace",
    marginTop: 14
  },
  appRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  appBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  }
});
