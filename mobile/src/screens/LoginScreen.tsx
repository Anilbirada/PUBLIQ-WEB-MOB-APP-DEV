import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Image } from "react-native";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export const LoginScreen: React.FC = () => {
  const [pin, setPin] = useState<string>("");
  const { loginWithPin, isLoading } = useAuth();

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const attemptLogin = async (code: string) => {
    try {
      await loginWithPin(code);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid Employee PIN.");
      setPin("");
    }
  };

  const handleDemoLogin = () => {
    setPin("6666");
    attemptLogin("6666");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Branding */}
        <View style={styles.header}>
          <Image 
            source={require("../../assets/logo.png")} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={styles.brandTitle}>P U B L I Q   W</Text>
          <Text style={styles.brandSubtitle}>SERVICE STEWARD TERMINAL</Text>
          <Text style={styles.instruction}>Enter your 4-digit Employee PIN</Text>

          {/* PIN Indicators */}
          <View style={styles.pinRow}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  pin.length > i && styles.pinDotFilled
                ]}
              />
            ))}
          </View>

          {isLoading && (
            <ActivityIndicator size="small" color={COLORS.gold} style={styles.loader} />
          )}
        </View>

        {/* Ergonomic One-Hand Numpad */}
        <View style={styles.numpad}>
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["C", "0", "⌫"]
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.numpadRow}>
              {row.map(key => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.keyButton,
                    (key === "C" || key === "⌫") && styles.keyButtonSpecial
                  ]}
                  onPress={() => {
                    if (key === "C") handleClear();
                    else if (key === "⌫") handleBackspace();
                    else handleNumberPress(key);
                  }}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.keyText,
                    (key === "C" || key === "⌫") && styles.keyTextSpecial
                  ]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Demo Waiter Shortcut */}
        <TouchableOpacity style={styles.demoShortcut} onPress={handleDemoLogin}>
          <Text style={styles.demoText}>Quick Demo: Steward Raju (PIN: 6666)</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20
  },
  header: {
    alignItems: "center",
    marginTop: 20
  },
  logoImage: {
    width: 160,
    height: 70,
    marginBottom: 6
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 4
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: 4
  },
  instruction: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 24
  },
  pinRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 18
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: "transparent"
  },
  pinDotFilled: {
    backgroundColor: COLORS.gold
  },
  loader: {
    marginTop: 16
  },
  numpad: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    gap: 12
  },
  numpadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  keyButton: {
    flex: 1,
    aspectRatio: 1.3,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center"
  },
  keyButtonSpecial: {
    backgroundColor: COLORS.surfaceElevated
  },
  keyText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary
  },
  keyTextSpecial: {
    fontSize: 18,
    color: COLORS.gold
  },
  demoShortcut: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.gold
  },
  demoText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "700"
  }
});
