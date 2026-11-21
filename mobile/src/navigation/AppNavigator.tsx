import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useLiveSync } from "../context/LiveSyncContext";

// Screens
import { LoginScreen } from "../screens/LoginScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { TablesScreen } from "../screens/TablesScreen";
import { QROrdersScreen } from "../screens/QROrdersScreen";
import { ManualOrderScreen } from "../screens/ManualOrderScreen";
import { OrderTrackingScreen } from "../screens/OrderTrackingScreen";
import { BillPaymentScreen } from "../screens/BillPaymentScreen";
import { QRScannerScreen } from "../screens/QRScannerScreen";
import { CallManagerModal } from "../screens/CallManagerModal";
import { ProfileScreen } from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabBarIconLabel({ label, icon, focused, badge }: { label: string; icon: string; focused: boolean; badge?: number }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MainTabs() {
  const { pendingOrdersCount, readyToServeCount } = useLiveSync();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + Math.max(insets.bottom, 6),
            paddingBottom: Math.max(insets.bottom, 8)
          }
        ],
        tabBarShowLabel: false
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIconLabel label="HOME" icon="🏛️" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Tables"
        component={TablesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIconLabel label="TABLES" icon="🪑" focused={focused} />
        }}
      />
      <Tab.Screen
        name="QROrders"
        component={QROrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIconLabel label="QR QUEUE" icon="📲" focused={focused} badge={pendingOrdersCount} />
          )
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={OrderTrackingScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIconLabel label="KDS/BAR" icon="⏱️" focused={focused} badge={readyToServeCount} />
          )
        }}
      />
      <Tab.Screen
        name="BillPayment"
        component={BillPaymentScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIconLabel label="BILLING" icon="💳" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIconLabel label="SHIFT" icon="👤" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ManualOrder" component={ManualOrderScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="CallManager" component={CallManagerModal} options={{ presentation: "modal" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minWidth: 54
  },
  tabIcon: {
    fontSize: 16,
    opacity: 0.6
  },
  tabIconFocused: {
    opacity: 1
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginTop: 3,
    letterSpacing: 0.5
  },
  tabLabelFocused: {
    color: COLORS.gold
  },
  badge: {
    position: "absolute",
    top: -4,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900"
  }
});
