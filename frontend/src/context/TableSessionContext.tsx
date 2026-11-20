"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface TableSessionData {
  tableNumber: string | null;
  tableId: string | null;
  outletId: string | null;
  outletName: string | null;
  outletCode: string | null;
  diningArea: string | null;
  sessionToken: string | null;
  alcoholServiceEnabled: boolean;
  legalDrinkingAge: number;
  isDineInActive: boolean;
}

interface TableSessionContextType extends TableSessionData {
  setTableSession: (data: Partial<TableSessionData>) => void;
  clearTableSession: () => void;
}

const TableSessionContext = createContext<TableSessionContextType | undefined>(undefined);

const STORAGE_KEY = "publiq_table_session";

export const TableSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<TableSessionData>({
    tableNumber: null,
    tableId: null,
    outletId: null,
    outletName: null,
    outletCode: null,
    diningArea: null,
    sessionToken: null,
    alcoholServiceEnabled: true,
    legalDrinkingAge: 21,
    isDineInActive: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession(parsed);
      }
    } catch (_) {}
  }, []);

  const setTableSession = (data: Partial<TableSessionData>) => {
    setSession((prev) => {
      const updated = {
        ...prev,
        ...data,
        isDineInActive: !!data.tableNumber || prev.isDineInActive,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const clearTableSession = () => {
    const empty: TableSessionData = {
      tableNumber: null,
      tableId: null,
      outletId: null,
      outletName: null,
      outletCode: null,
      diningArea: null,
      sessionToken: null,
      alcoholServiceEnabled: true,
      legalDrinkingAge: 21,
      isDineInActive: false,
    };
    setSession(empty);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  };

  return (
    <TableSessionContext.Provider
      value={{
        ...session,
        setTableSession,
        clearTableSession,
      }}
    >
      {children}
    </TableSessionContext.Provider>
  );
};

export const useTableSession = () => {
  const context = useContext(TableSessionContext);
  if (!context) {
    throw new Error("useTableSession must be used within a TableSessionProvider");
  }
  return context;
};
