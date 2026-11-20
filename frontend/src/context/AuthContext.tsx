"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export interface CustomerUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  isGuest?: boolean;
}

interface AuthContextType {
  user: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneOrEmail: string, pass: string) => Promise<void>;
  register: (data: { phone: string; full_name: string; email?: string; password?: string }) => Promise<void>;
  ensureGuestSession: () => Promise<CustomerUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "publiq_auth_token";
const USER_KEY = "publiq_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (_) {}
    setIsLoading(false);
  }, []);

  const login = async (phoneOrEmail: string, pass: string) => {
    const res = await api.loginCustomer(phoneOrEmail, pass);
    const userData: CustomerUser = {
      id: res.customer_id,
      fullName: res.full_name || "Valued Diner",
      phone: res.phone || "",
      email: res.email || "",
      loyaltyPoints: res.loyalty_points || 0,
      isGuest: false,
    };
    setToken(res.access_token);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const register = async (data: { phone: string; full_name: string; email?: string; password?: string }) => {
    const res = await api.registerCustomer(data);
    const userData: CustomerUser = {
      id: res.customer_id,
      fullName: res.full_name || data.full_name,
      phone: res.phone || data.phone,
      email: res.email || data.email,
      loyaltyPoints: res.loyalty_points || 50,
      isGuest: false,
    };
    setToken(res.access_token);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const ensureGuestSession = async (): Promise<CustomerUser> => {
    if (user && token) return user;
    const res = await api.createGuestSession();
    const guestUser: CustomerUser = {
      id: res.customer_id,
      fullName: "Guest Diner",
      phone: "",
      email: "",
      loyaltyPoints: 0,
      isGuest: true,
    };
    setToken(res.access_token);
    setUser(guestUser);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
    return guestUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !user.isGuest,
        isLoading,
        login,
        register,
        ensureGuestSession,
        logout,
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
