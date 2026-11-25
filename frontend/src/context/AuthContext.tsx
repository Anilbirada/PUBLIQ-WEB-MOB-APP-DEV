"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export interface AuthUser {
  id: string;
  fullName: string;
  role: "SUPER_ADMIN" | "BAR_ADMIN" | "FOOD_ADMIN" | "WAITER" | "CUSTOMER" | string;
  roleLabel: string;
  department: "ALL" | "BEVERAGE" | "FOOD" | "FLOOR" | "GUEST" | string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
  isGuest?: boolean;
  allowedRoutes?: string[];
  permissions?: string[];
  redirectUrl?: string;
}

// Backward compatibility alias
export type CustomerUser = AuthUser;

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  universalLogin: (params: {
    role?: string;
    identifier?: string;
    password?: string;
    pin?: string;
  }) => Promise<AuthUser>;
  login: (phoneOrEmail: string, pass: string) => Promise<void>;
  register: (data: { phone: string; full_name: string; email?: string; password?: string }) => Promise<void>;
  ensureGuestSession: () => Promise<AuthUser>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "publiq_auth_token";
const USER_KEY = "publiq_auth_user";
const ROLE_KEY = "publiq_role";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
      }
    } catch (_) {}
    setIsLoading(false);
  }, []);

  const universalLogin = async (params: {
    role?: string;
    identifier?: string;
    password?: string;
    pin?: string;
  }): Promise<AuthUser> => {
    // Attempt real database-authenticated login
    try {
      const res = await api.universalLogin(params);
      const serverUser = res.user;
      const authUser: AuthUser = {
        id: serverUser.id,
        fullName: serverUser.name || "PUBLIQ Staff",
        role: serverUser.role,
        roleLabel: serverUser.role_label,
        department: serverUser.department,
        email: serverUser.email,
        phone: serverUser.phone,
        allowedRoutes: serverUser.allowed_routes || [],
        permissions: serverUser.permissions || [],
        redirectUrl: serverUser.redirect_url,
        isGuest: serverUser.role === "CUSTOMER",
      };

      setToken(res.access_token);
      setUser(authUser);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      localStorage.setItem(ROLE_KEY, serverUser.role);
      return authUser;
    } catch (err: any) {
      // Re-throw authentication rejection errors (PUB-QA-050: Login with invalid credentials must be rejected)
      // Never bypass invalid passwords or fake credentials
      throw err;
    }
  };

  const login = async (phoneOrEmail: string, pass: string) => {
    const res = await api.loginCustomer(phoneOrEmail, pass);
    const userData: AuthUser = {
      id: res.customer_id,
      fullName: res.full_name || "Valued Diner",
      role: "CUSTOMER",
      roleLabel: "Registered Diner",
      department: "GUEST",
      phone: res.phone || "",
      email: res.email || "",
      loyaltyPoints: res.loyalty_points || 0,
      isGuest: false,
      redirectUrl: "/menu",
    };
    setToken(res.access_token);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(ROLE_KEY, "CUSTOMER");
  };

  const register = async (data: { phone: string; full_name: string; email?: string; password?: string }) => {
    const res = await api.registerCustomer(data);
    const userData: AuthUser = {
      id: res.customer_id,
      fullName: res.full_name || data.full_name,
      role: "CUSTOMER",
      roleLabel: "Registered Diner",
      department: "GUEST",
      phone: res.phone || data.phone,
      email: res.email || data.email,
      loyaltyPoints: res.loyalty_points || 50,
      isGuest: false,
      redirectUrl: "/menu",
    };
    setToken(res.access_token);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(ROLE_KEY, "CUSTOMER");
  };

  const ensureGuestSession = async (): Promise<AuthUser> => {
    if (user && token) return user;
    try {
      const res = await api.createGuestSession();
      const guestUser: AuthUser = {
        id: res.customer_id,
        fullName: "Guest Diner",
        role: "CUSTOMER",
        roleLabel: "Guest Diner",
        department: "GUEST",
        phone: "",
        email: "",
        loyaltyPoints: 0,
        isGuest: true,
        redirectUrl: "/menu",
      };
      setToken(res.access_token);
      setUser(guestUser);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
      localStorage.setItem(ROLE_KEY, "CUSTOMER");
      return guestUser;
    } catch (_) {
      const mockGuest: AuthUser = {
        id: `guest-${Date.now()}`,
        fullName: "Guest Diner",
        role: "CUSTOMER",
        roleLabel: "Guest Diner",
        department: "GUEST",
        loyaltyPoints: 0,
        isGuest: true,
        redirectUrl: "/menu",
      };
      setUser(mockGuest);
      return mockGuest;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    return (user.permissions || []).includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || "GUEST",
        isAuthenticated: !!user && !user.isGuest,
        isLoading,
        universalLogin,
        login,
        register,
        ensureGuestSession,
        logout,
        hasPermission,
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
