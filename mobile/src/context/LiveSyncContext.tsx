import React, { createContext, useContext, useState, useEffect } from "react";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "./AuthContext";

interface DashboardMetrics {
  total_tables: number;
  available_tables: number;
  occupied_tables: number;
  pending_approval: number;
  preparing_orders: number;
  ready_to_serve: number;
  pending_bills: number;
}

interface LiveSyncContextType {
  metrics: DashboardMetrics;
  pendingOrdersCount: number;
  readyToServeCount: number;
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
}

const defaultMetrics: DashboardMetrics = {
  total_tables: 16,
  available_tables: 16,
  occupied_tables: 0,
  pending_approval: 0,
  preparing_orders: 0,
  ready_to_serve: 0,
  pending_bills: 0
};

const LiveSyncContext = createContext<LiveSyncContextType | undefined>(undefined);

export const LiveSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveMetrics = async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await mobileApiRequest("/waiter/dashboard", { method: "GET" }, token);
      if (res && res.summary) {
        setMetrics(res.summary);
      }
    } catch (e) {
      console.warn("LiveSync fetch error:", e);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchLiveMetrics();
    setIsRefreshing(false);
  };

  // Poll live operational status every 5 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  return (
    <LiveSyncContext.Provider
      value={{
        metrics,
        pendingOrdersCount: metrics.pending_approval,
        readyToServeCount: metrics.ready_to_serve,
        refreshData,
        isRefreshing
      }}
    >
      {children}
    </LiveSyncContext.Provider>
  );
};

export const useLiveSync = () => {
  const context = useContext(LiveSyncContext);
  if (!context) {
    throw new Error("useLiveSync must be used within a LiveSyncProvider");
  }
  return context;
};
