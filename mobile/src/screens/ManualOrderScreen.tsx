import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert } from "react-native";
import { COLORS } from "../theme/colors";
import { Header } from "../components/Header";
import { mobileApiRequest } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useLiveSync } from "../context/LiveSyncContext";

export const ManualOrderScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { token, waiter } = useAuth();
  const { refreshData } = useLiveSync();

  const [tableNumber, setTableNumber] = useState<string>(route.params?.table_number || "01");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tablesList, setTablesList] = useState<any[]>([]);

  useEffect(() => {
    fetchMenu();
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data: any = await mobileApiRequest("/waiter/tables", { method: "GET" }, token);
      if (Array.isArray(data)) setTablesList(data);
    } catch (_) {}
  };

  const fetchMenu = async () => {
    try {
      const data: any = await mobileApiRequest("/menu", { method: "GET" }, token);
      if (Array.isArray(data)) {
        setCategories(data);
        const allItems: any[] = [];
        data.forEach(cat => {
          if (cat.items) {
            cat.items.forEach((it: any) => {
              allItems.push({ ...it, category_name: cat.name });
            });
          }
        });
        setMenuItems(allItems);
      }
    } catch (e) {
      console.warn("Failed to load menu:", e);
    }
  };

  const addItemToCart = (item: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, {
          id: item.id,
          name: item.name,
          base_price: item.base_price,
          quantity: 1,
          is_alcohol: item.is_alcohol
        }];
      }
    });
  };

  const removeItemFromCart = (itemId: string) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const subtotal = cartItems.reduce((acc, it) => acc + (it.base_price * it.quantity), 0);
  const gst = round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + gst;

  function round(val: number) {
    return Math.round(val * 100) / 100;
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Cart Empty", "Please add at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        table_number: tableNumber,
        waiter_name: waiter?.name || "Service Steward",
        customer_name: `Table ${tableNumber} Guest`,
        items: cartItems.map(ci => ({
          item_id: ci.id,
          item_name: ci.name,
          quantity: ci.quantity,
          unit_price: ci.base_price,
          is_alcohol: ci.is_alcohol
        }))
      };

      const res: any = await mobileApiRequest("/waiter/orders/manual", {
        method: "POST",
        body: JSON.stringify(payload)
      }, token);

      Alert.alert(
        "Order Created & Dispatched",
        `Order ${res.order_number} for Table ${tableNumber} sent to Kitchen & Bar.`,
        [
          {
            text: "View Tracking",
            onPress: () => {
              refreshData();
              navigation.navigate("Tracking");
            }
          },
          {
            text: "OK",
            onPress: () => {
              setCartItems([]);
              refreshData();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert("Order Failed", e.message || "Failed to create order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter(it => {
    const matchesCat = selectedCat === "all" || it.category_id === selectedCat || it.category_name === selectedCat;
    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="NEW TABLE ORDER" subtitle="Direct Steward POS Punch" />

      {/* Table Selector & Search */}
      <View style={styles.topControl}>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 1, marginBottom: 6 }}>
            SELECT OUTLET TABLE:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(tablesList.length > 0 ? tablesList : [
              { table_number: "01" }, { table_number: "02" }, { table_number: "03" }, { table_number: "04" },
              { table_number: "05" }, { table_number: "06" }, { table_number: "07" }, { table_number: "08" }
            ]).map((t: any) => (
              <TouchableOpacity
                key={t.table_number}
                style={{
                  backgroundColor: tableNumber === t.table_number ? COLORS.gold : COLORS.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 6,
                  borderWidth: 1,
                  borderColor: tableNumber === t.table_number ? COLORS.gold : COLORS.border
                }}
                onPress={() => setTableNumber(t.table_number)}
              >
                <Text style={{
                  color: tableNumber === t.table_number ? "#070B12" : COLORS.textSecondary,
                  fontWeight: "bold",
                  fontSize: 11
                }}>
                  T-{t.table_number}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tableInputRow}>
          <Text style={styles.tableLabel}>TABLE NO:</Text>
          <TextInput
            style={styles.tableInput}
            value={tableNumber}
            onChangeText={setTableNumber}
            placeholder="01"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="default"
          />
        </View>

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search dishes or cocktails..."
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        <TouchableOpacity
          style={[styles.catPill, selectedCat === "all" && styles.catPillActive]}
          onPress={() => setSelectedCat("all")}
        >
          <Text style={[styles.catText, selectedCat === "all" && styles.catTextActive]}>ALL</Text>
        </TouchableOpacity>

        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catPill, selectedCat === cat.id && styles.catPillActive]}
            onPress={() => setSelectedCat(cat.id)}
          >
            <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu Catalog Grid */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const inCart = cartItems.find(ci => ci.id === item.id);
          return (
            <View style={styles.menuRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.base_price.toFixed(0)} • {item.is_alcohol ? "🍸 Bar" : "🍳 Kitchen"}</Text>
              </View>

              <View style={styles.qtyControl}>
                {inCart ? (
                  <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.minusBtn} onPress={() => removeItemFromCart(item.id)}>
                      <Text style={styles.btnSymbol}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{inCart.quantity}</Text>
                    <TouchableOpacity style={styles.plusBtn} onPress={() => addItemToCart(item)}>
                      <Text style={styles.btnSymbol}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => addItemToCart(item)}>
                    <Text style={styles.addBtnText}>+ ADD</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.menuList}
      />

      {/* Bottom Cart Checkout Bar */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutItems}>{cartItems.reduce((a, c) => a + c.quantity, 0)} Items for Table {tableNumber}</Text>
            <Text style={styles.checkoutTotal}>Total: ₹{grandTotal.toFixed(2)} <Text style={styles.gstText}>(incl. 5% GST)</Text></Text>
          </View>

          <TouchableOpacity
            style={styles.submitOrderBtn}
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.submitOrderText}>{isSubmitting ? "SENDING..." : "DISPATCH ORDER"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  topControl: {
    padding: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    gap: 10
  },
  tableInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.gold
  },
  tableLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.gold,
    marginRight: 4
  },
  tableInput: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 14,
    minWidth: 32
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  catScroll: {
    maxHeight: 46,
    backgroundColor: COLORS.surface
  },
  catContent: {
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated
  },
  catPillActive: {
    backgroundColor: COLORS.gold
  },
  catText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary
  },
  catTextActive: {
    color: "#070B12",
    fontWeight: "900"
  },
  menuList: {
    padding: 12,
    paddingBottom: 90
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8
  },
  itemInfo: {
    flex: 1,
    marginRight: 10
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary
  },
  itemPrice: {
    fontSize: 11,
    color: COLORS.gold,
    marginTop: 2
  },
  qtyControl: {
    alignItems: "flex-end"
  },
  addBtn: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  addBtnText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "900"
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold
  },
  minusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  plusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  btnSymbol: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: "900"
  },
  qtyNum: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.textPrimary,
    minWidth: 18,
    textAlign: "center"
  },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 2,
    borderColor: COLORS.gold,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  checkoutItems: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  checkoutTotal: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary
  },
  gstText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "400"
  },
  submitOrderBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10
  },
  submitOrderText: {
    color: "#070B12",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5
  }
});
