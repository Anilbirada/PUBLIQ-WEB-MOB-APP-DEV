import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { LiveSyncProvider } from "./src/context/LiveSyncContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LiveSyncProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </LiveSyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
