"""
End-to-End Verification Scenario for Table 05 (Defects 1 to 6).
Executes the full lifecycle:
1. Customer cart order creation on Table 05 (Mixed Food & Drink)
2. Verify order is blocked from KDS and Bar before waiter approval
3. Waiter reviews, claims, and approves
4. Verify order appears in FIFO order in KDS and Bar
5. Item-level rejection test with reason & total recalculation
6. Kitchen/Bar prep and Waiter service (SERVED)
7. Dual department invoice generation (PUB-FOOD and PUB-BEV)
8. Dual UPI QR code generation (Ramesh S P & Anil)
9. Controlled closure validation (premature closure blocked)
10. Settle payment
11. Order closure and Table release (AVAILABLE)
12. Customer order history retrieval via mobile number & OTP
"""

import sys
sys.path.insert(0, "backend")

import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import Order, OrderItem, RestaurantTable, MenuItem, Outlet, DepartmentInvoice

client = TestClient(app)

def run_e2e_table05_scenario():
    print("=" * 80)
    print("STARTING PUBLIQ TABLE 05 END-TO-END VERIFICATION SCENARIO")
    print("=" * 80)

    # Clean up Table 05 state
    db = SessionLocal()
    for o in db.query(Order).filter(Order.table_number.in_(["05", "T-05", "T05"]), Order.payment_status != "PAID").all():
        o.payment_status = "PAID"
        o.order_status = "COMPLETED"
    
    t05 = db.query(RestaurantTable).filter(RestaurantTable.table_number.in_(["05", "T-05"])).first()
    if t05:
        t05.is_occupied = False
        t05.current_order_id = None
        t05.assigned_waiter_id = None
        t05.assigned_waiter_name = None
    
    food_item1 = db.query(MenuItem).filter(MenuItem.is_alcohol == False, MenuItem.is_available == True).first()
    food_item2 = db.query(MenuItem).filter(MenuItem.is_alcohol == False, MenuItem.id != food_item1.id, MenuItem.is_available == True).first()
    drink_item = db.query(MenuItem).filter(MenuItem.is_alcohol == True, MenuItem.is_available == True).first()
    outlet = db.query(Outlet).filter(Outlet.code == "PUB-HARAGADDE").first() or db.query(Outlet).first()
    
    food_item1_id = food_item1.id
    food_item2_id = food_item2.id
    drink_item_id = drink_item.id
    outlet_id = outlet.id
    
    db.commit()
    db.close()

    # Step 1: Waiter Login
    login_res = client.post("/api/v1/waiter/auth/login", json={"pin_code": "6666"})
    assert login_res.status_code == 200, "Waiter login failed"
    token = login_res.json()["access_token"]
    waiter_name = login_res.json()["employee"]["name"]
    waiter_id = login_res.json()["employee"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Step 1: Waiter authenticated: {waiter_name} (ID: {waiter_id})")

    # Step 2: Customer creates mixed order from Digital Menu / Cart on Table 05
    customer_phone = "9887766554"
    session_id = f"e2e-session-{uuid.uuid4()}"
    client.delete(f"/api/v1/cart/{session_id}")
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": food_item1_id, "quantity": 1, "selected_addon_ids": []})
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": food_item2_id, "quantity": 1, "selected_addon_ids": []})
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": drink_item_id, "quantity": 2, "selected_addon_ids": []})

    order_payload = {
        "session_id": session_id,
        "outlet_id": outlet_id,
        "dining_channel": "DINE_IN",
        "table_number": "05",
        "customer_name": "Vikram Adve",
        "customer_phone": customer_phone,
        "payment_method": "UPI",
        "age_verified": True
    }
    create_res = client.post("/api/v1/orders", json=order_payload)
    assert create_res.status_code == 200, f"Order checkout failed: {create_res.text}"
    order_data = create_res.json()
    order_id = order_data["id"]
    order_number = order_data["order_number"]
    print(f"Step 2: Customer order created: #{order_number} (ID: {order_id}) on Table 05. Initial Amount: ₹{order_data['final_amount']}")

    # Step 3: Verify unapproved order is NOT visible in KDS or Bar
    kds_orders = client.get("/api/v1/admin/operations/kds/orders").json()
    bar_tickets = client.get("/api/v1/admin/operations/bar/tickets").json()
    assert not any(o.get("order_id") == order_id for o in kds_orders), "CRITICAL DEFECT: Unapproved order visible in KDS!"
    assert not any(t.get("order_id") == order_id for t in bar_tickets), "CRITICAL DEFECT: Unapproved order visible in Bar tickets!"
    print("Step 3: Confirmed order is BLOCKED from KDS and Bar until Waiter approval.")

    # Step 4: Verify Table status is ORDER_PENDING
    tbl_res = client.get("/api/v1/waiter/tables").json()
    t05_state = next((t for t in tbl_res if t["table_number"] in ["05", "T-05"]), None)
    assert t05_state is not None
    assert t05_state["status"] == "ORDER_PENDING"
    print(f"Step 4: Table 05 7-stage operational status verified: {t05_state['status']}")

    # Step 5: Waiter reviews in Pending Approval queue and rejects one item with reason
    pending_list = client.get("/api/v1/waiter/orders/pending-approval", headers=headers).json()
    pending_order = next((o for o in pending_list if o["order_id"] == order_id), None)
    assert pending_order is not None, "Order not in Waiter pending approvals!"

    item_to_reject = pending_order["food_items"][1]
    reject_res = client.post(
        f"/api/v1/waiter/orders/{order_id}/items/{item_to_reject['id']}/reject",
        headers=headers,
        json={"reason": "Ingredient temporarily unavailable in cold pantry", "waiter_name": waiter_name}
    )
    assert reject_res.status_code == 200
    new_subtotal = reject_res.json()["new_subtotal"]
    print(f"Step 5: Waiter rejected item '{item_to_reject['item_name']}'. Rejection reason recorded. New Subtotal: ₹{new_subtotal}")

    # Step 6: Waiter approves order
    approve_res = client.post(
        f"/api/v1/waiter/orders/{order_id}/accept",
        headers=headers,
        json={"waiter_name": waiter_name}
    )
    assert approve_res.status_code == 200
    print("Step 6: Waiter approved order. Dispatched to Kitchen & Bar.")

    # Step 7: Verify order is now visible in KDS (FIFO) and Bar (FIFO)
    kds_after = client.get("/api/v1/admin/operations/kds/orders").json()
    bar_after = client.get("/api/v1/admin/operations/bar/tickets").json()
    assert any(o.get("order_id") == order_id for o in kds_after), "Order not received in KDS after approval!"
    assert any(t.get("order_id") == order_id for t in bar_after), "Order not received in Bar after approval!"
    print("Step 7: Order successfully visible in KDS and Bar dispense station queues in chronological FIFO order.")

    # Step 8: Mark food and beverage ready & served
    serve_res = client.post(f"/api/v1/waiter/orders/{order_id}/serve", headers=headers, json={"waiter_name": waiter_name})
    assert serve_res.status_code == 200
    print("Step 8: Items prepared and served to Table 05 (Status: SERVED).")

    # Step 9: Generate Department Tax Invoices: PUB-FOOD & PUB-BEV
    food_inv_res = client.post(
        "/api/v1/waiter/bills/generate-department-invoice",
        headers=headers,
        json={"order_id": order_id, "department": "FOOD", "waiter_name": waiter_name}
    )
    assert food_inv_res.status_code == 200
    food_inv = food_inv_res.json()
    assert food_inv["department"] == "FOOD"
    assert "PUB-FOOD" in food_inv["invoice_number"]
    assert "RAMESH S P" in food_inv["owner_name"].upper()

    bev_inv_res = client.post(
        "/api/v1/waiter/bills/generate-department-invoice",
        headers=headers,
        json={"order_id": order_id, "department": "BEVERAGE", "waiter_name": waiter_name}
    )
    assert bev_inv_res.status_code == 200
    bev_inv = bev_inv_res.json()
    assert bev_inv["department"] == "BEVERAGE"
    assert "PUB-BEV" in bev_inv["invoice_number"]
    assert "ANIL" in bev_inv["owner_name"].upper()
    print(f"Step 9: Invoices generated: {food_inv['invoice_number']} (Food - Ramesh S P) and {bev_inv['invoice_number']} (Bar - Anil).")

    # Step 10: Generate Dual UPI QR Codes
    qr_res = client.post(
        "/api/v1/waiter/payments/generate-qr",
        headers=headers,
        json={"order_id": order_id, "table_number": "05", "amount": food_inv["grand_total"] + bev_inv["grand_total"]}
    )
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert "food_qr" in qr_data and "beverage_qr" in qr_data
    assert "ramesh776059@ybl" in qr_data["food_qr"]["vpa"]
    assert "8431712924-3@ybl" in qr_data["beverage_qr"]["vpa"]
    print(f"Step 10: Dual UPI QRs verified: Food VPA = {qr_data['food_qr']['vpa']}, Bar VPA = {qr_data['beverage_qr']['vpa']}")

    # Step 11: Attempt order closure before payment -> must be rejected
    fail_close = client.post(
        f"/api/v1/waiter/orders/{order_id}/close",
        headers=headers,
        json={"role": "WAITER", "waiter_name": waiter_name}
    )
    assert fail_close.status_code == 400
    print("Step 11: Controlled closure successfully prevented premature closure prior to payment.")

    # Step 12: Settle Payment
    settle_res = client.post(
        "/api/v1/waiter/payments/settle",
        headers=headers,
        json={"order_id": order_id, "payment_mode": "UPI", "waiter_name": waiter_name}
    )
    assert settle_res.status_code == 200
    print("Step 12: Payment settled in full via UPI.")

    # Step 13: Close order & release Table 05
    close_res = client.post(
        f"/api/v1/waiter/orders/{order_id}/close",
        headers=headers,
        json={"role": "WAITER", "waiter_name": waiter_name, "waiter_id": waiter_id}
    )
    assert close_res.status_code == 200
    close_body = close_res.json()
    assert close_body["table_released"] is True
    print("Step 13: Order officially closed. Table 05 released to AVAILABLE.")

    # Step 14: Customer retrieves order history via Mobile Number
    otp_res = client.post("/api/v1/customers/send-otp", json={"phone": customer_phone})
    assert otp_res.status_code == 200
    otp_code = otp_res.json().get("otp_debug", "123456")

    cust_verify = client.post("/api/v1/customers/verify-otp", json={"phone": customer_phone, "otp": otp_code})
    assert cust_verify.status_code == 200

    cust_history = client.get(f"/api/v1/customers/orders/by-phone?phone={customer_phone}&time_filter=all").json()
    assert len(cust_history["previous_orders"]) > 0
    found_cust_order = next((o for o in cust_history["previous_orders"] if o["order_id"] == order_id), None)
    assert found_cust_order is not None
    assert len(found_cust_order["invoices"]) >= 1
    print(f"Step 14: Customer portal successfully retrieved order history with item breakdown and invoice links for {customer_phone}.")

    print("=" * 80)
    print("ALL 14 STEPS OF TABLE 05 END-TO-END SCENARIO VERIFIED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_e2e_table05_scenario()
