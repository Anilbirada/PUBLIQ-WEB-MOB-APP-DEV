const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";
export const API_BASE_URL = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase.replace(/\/$/, "")}/api/v1`;

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Brand & Outlets
  getRestaurant: () => apiRequest<any>("/restaurant"),
  getOutlets: () => apiRequest<any[]>("/outlets"),
  
  // QR & Table Session
  validateQrToken: (token: string) => 
    apiRequest<any>("/qr-sessions/validate", {
      method: "POST",
      body: JSON.stringify({ token })
    }),
  generateTableQr: (outletId: string, tableNumber: string) =>
    apiRequest<any>("/qr-sessions/generate", {
      method: "POST",
      body: JSON.stringify({ outlet_id: outletId, table_number: tableNumber })
    }),

  // Menu
  getMenu: (params?: { outlet_id?: string; veg_only?: boolean; include_alcohol?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.outlet_id) q.append("outlet_id", params.outlet_id);
    if (params?.veg_only !== undefined) q.append("veg_only", String(params.veg_only));
    if (params?.include_alcohol !== undefined) q.append("include_alcohol", String(params.include_alcohol));
    if (params?.search) q.append("search", params.search);
    const queryString = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<any[]>(`/menu${queryString}`);
  },
  getCategories: (params?: { outlet_id?: string; veg_only?: boolean; include_alcohol?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.outlet_id) q.append("outlet_id", params.outlet_id);
    if (params?.veg_only !== undefined) q.append("veg_only", String(params.veg_only));
    if (params?.include_alcohol !== undefined) q.append("include_alcohol", String(params.include_alcohol));
    if (params?.search) q.append("search", params.search);
    const queryString = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<any[]>(`/menu${queryString}`);
  },
  getProduct: (id: string) => apiRequest<any>(`/products/${id}`),

  // Cart
  getCart: (sessionId: string) => apiRequest<any>(`/cart/${sessionId}`),
  initCart: (sessionId: string, outletId: string, diningChannel: string = "DINE_IN", tableNumber?: string, qrSessionId?: string) =>
    apiRequest<any>(`/cart/${sessionId}/init`, {
      method: "POST",
      body: JSON.stringify({
        outlet_id: outletId,
        dining_channel: diningChannel,
        table_number: tableNumber,
        qr_session_id: qrSessionId
      })
    }),
  addToCart: (sessionId: string, data: { item_id: string; variant_id?: string; quantity: number; selected_addon_ids?: string[]; special_request?: string; outlet_id?: string; table_number?: string }) => {
    const q = new URLSearchParams();
    if (data.outlet_id) q.append("outlet_id", data.outlet_id);
    if (data.table_number) q.append("table_number", data.table_number);
    const query = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<any>(`/cart/${sessionId}/items${query}`, {
      method: "POST",
      body: JSON.stringify({
        item_id: data.item_id,
        variant_id: data.variant_id || null,
        quantity: data.quantity,
        selected_addon_ids: data.selected_addon_ids || [],
        special_request: data.special_request || null
      })
    });
  },
  updateCartItem: (sessionId: string, cartItemId: string, quantity: number, specialRequest?: string) =>
    apiRequest<any>(`/cart/${sessionId}/items/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity, special_request: specialRequest || null })
    }),
  removeCartItem: (sessionId: string, cartItemId: string) =>
    apiRequest<any>(`/cart/${sessionId}/items/${cartItemId}`, {
      method: "DELETE"
    }),
  clearCart: (sessionId: string) =>
    apiRequest<any>(`/cart/${sessionId}`, {
      method: "DELETE"
    }),

  // Orders
  createOrder: (orderPayload: any) =>
    apiRequest<any>("/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload)
    }),
  getOrder: (identifier: string) => apiRequest<any>(`/orders/${identifier}`),
  trackOrder: (orderNumber: string) => apiRequest<any>(`/order-tracking/${orderNumber}`),

  // Payments
  initiatePayment: (orderId: string, paymentMethod: string) =>
    apiRequest<any>("/payments/initiate", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, payment_method: paymentMethod })
    }),
  verifyPayment: (paymentId: string, transactionRef: string, simulatedSuccess: boolean = true) =>
    apiRequest<any>("/payments/verify", {
      method: "POST",
      body: JSON.stringify({
        payment_id: paymentId,
        transaction_ref: transactionRef,
        simulated_success: simulatedSuccess
      })
    }),

  // Auth & Customers
  registerCustomer: (data: { phone: string; full_name: string; email?: string; password?: string }) =>
    apiRequest<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  loginCustomer: (phoneOrEmail: string, password: string) =>
    apiRequest<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone_or_email: phoneOrEmail, password })
    }),
  createGuestSession: () =>
    apiRequest<any>("/auth/guest-session", {
      method: "POST"
    }),
  getCustomerProfile: (token: string) =>
    apiRequest<any>("/customers/profile", {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getCustomerOrders: (token: string) =>
    apiRequest<any>("/customers/orders", {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Reservations
  createReservation: (data: any) =>
    apiRequest<any>("/reservations", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getReservations: (status?: string, date?: string) => {
    const q = new URLSearchParams();
    if (status) q.append("status", status);
    if (date) q.append("date", date);
    const query = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<any[]>(`/reservations${query}`);
  },
  updateReservationStatus: (reservationId: string, status: string, tableAssigned?: string) =>
    apiRequest<any>(`/reservations/${reservationId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, table_assigned: tableAssigned })
    }),
  getReservation: (ref: string) => apiRequest<any>(`/reservations/${ref}`),

  // Experience, CMS, Events, Gallery & AI
  getExperienceVideos: () => apiRequest<any[]>("/experience/videos"),
  getGallery: (category?: string) =>
    apiRequest<any[]>(`/experience/gallery${category ? `?category=${category}` : ""}`),
  getTestimonials: () => apiRequest<any[]>("/experience/testimonials"),
  submitEventEnquiry: (payload: any) =>
    apiRequest<any>("/experience/events/enquiry", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  askAiAssistant: (message: string, context?: any) =>
    apiRequest<any>("/experience/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, guest_context: context })
    }),
};
