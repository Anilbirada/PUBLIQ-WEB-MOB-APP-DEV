"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useTableSession } from "./TableSessionContext";

export interface CartItemType {
  id: string;
  item_id: string;
  item_name: string;
  item_image?: string;
  is_veg: boolean;
  is_alcohol: boolean;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  selected_addons: Array<{ id: string; name: string; price: number }>;
  total_price: number;
  special_request?: string;
}

export interface CartContextType {
  sessionId: string;
  items: CartItemType[];
  itemCount: number;
  subtotal: number;
  foodSubtotal: number;
  beverageSubtotal: number;
  foodFinal: number;
  beverageFinal: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  packagingFee: number;
  deliveryFee: number;
  discountAmount: number;
  finalAmount: number;
  diningChannel: string;
  setDiningChannel: (channel: string) => void;
  isLoading: boolean;
  addItem: (data: {
    item_id: string;
    variant_id?: string;
    quantity?: number;
    selected_addon_ids?: string[];
    special_request?: string;
  }) => Promise<void>;
  updateItemQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tableNumber, outletId, sessionToken } = useTableSession();
  const [sessionId, setSessionId] = useState<string>("");
  const [items, setItems] = useState<CartItemType[]>([]);
  const [itemCount, setItemCount] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [foodSubtotal, setFoodSubtotal] = useState<number>(0);
  const [beverageSubtotal, setBeverageSubtotal] = useState<number>(0);
  const [foodFinal, setFoodFinal] = useState<number>(0);
  const [beverageFinal, setBeverageFinal] = useState<number>(0);
  const [cgst, setCgst] = useState<number>(0);
  const [sgst, setSgst] = useState<number>(0);
  const [totalTax, setTotalTax] = useState<number>(0);
  const [packagingFee, setPackagingFee] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [diningChannel, setDiningChannel] = useState<string>("DINE_IN");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize unique session ID
  useEffect(() => {
    let sid = localStorage.getItem("publiq_cart_session_id");
    if (!sid) {
      sid = "pub_session_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("publiq_cart_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  const syncCartState = (data: any) => {
    if (!data) return;
    setItems(data.items || []);
    setItemCount(data.item_count || 0);
    setSubtotal(data.subtotal || 0);
    setFoodSubtotal(data.food_subtotal || 0);
    setBeverageSubtotal(data.beverage_subtotal || 0);
    setFoodFinal(data.food_final || 0);
    setBeverageFinal(data.beverage_final || 0);
    setCgst(data.cgst || 0);
    setSgst(data.sgst || 0);
    setTotalTax(data.total_tax || 0);
    setPackagingFee(data.packaging_fee || 0);
    setDeliveryFee(data.delivery_fee || 0);
    setDiscountAmount(data.discount_amount || 0);
    setFinalAmount(data.final_amount || 0);
    if (data.dining_channel) {
      setDiningChannel(data.dining_channel);
    }
  };

  const refreshCart = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const data = await api.getCart(sessionId);
      syncCartState(data);
    } catch (_) {
      // Ignore network errors in initial sync
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      refreshCart();
    }
  }, [sessionId, refreshCart]);

  const addItem = async (data: {
    item_id: string;
    variant_id?: string;
    quantity?: number;
    selected_addon_ids?: string[];
    special_request?: string;
  }) => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await api.addToCart(sessionId, {
        item_id: data.item_id,
        variant_id: data.variant_id,
        quantity: data.quantity || 1,
        selected_addon_ids: data.selected_addon_ids || [],
        special_request: data.special_request,
        outlet_id: outletId || undefined,
        table_number: tableNumber || undefined,
      });
      syncCartState(res);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = async (cartItemId: string, quantity: number) => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await api.updateCartItem(sessionId, cartItemId, quantity);
      syncCartState(res);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await api.removeCartItem(sessionId, cartItemId);
      syncCartState(res);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await api.clearCart(sessionId);
      syncCartState(res);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        sessionId,
        items,
        itemCount,
        subtotal,
        foodSubtotal,
        beverageSubtotal,
        foodFinal,
        beverageFinal,
        cgst,
        sgst,
        totalTax,
        packagingFee,
        deliveryFee,
        discountAmount,
        finalAmount,
        diningChannel,
        setDiningChannel,
        isLoading,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
