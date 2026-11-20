import React, { createContext, useContext, useState, useEffect } from "react";
import { mobileApiRequest } from "../config/api";

export interface WaiterEmployee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  outlet_id: string;
  outlet_name: string;
}

interface AuthContextType {
  token: string | null;
  waiter: WaiterEmployee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [waiter, setWaiter] = useState<WaiterEmployee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loginWithPin = async (pin: string) => {
    setIsLoading(true);
    try {
      const res: any = await mobileApiRequest("/waiter/auth/login", {
        method: "POST",
        body: JSON.stringify({ pin_code: pin })
      });

      setToken(res.access_token);
      setWaiter(res.employee);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setWaiter(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        waiter,
        isAuthenticated: !!token,
        isLoading,
        loginWithPin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
