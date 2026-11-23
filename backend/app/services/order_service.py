import datetime
import random
import secrets
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.models import (
    Order, OrderItem, OrderStatusHistory, Cart, CartItem, MenuItem,
    Outlet, PosOutboxEvent, OrderStatusEnum, PaymentStatusEnum, DiningChannelEnum,
    Customer, RestaurantTable
)
from app.schemas import OrderCreateRequest
from app.services.cart_service import CartService
from app.core.config import settings
from app.core.department import determine_item_department

class OrderService:
    @staticmethod
    def generate_order_number(outlet_code: str) -> str:
        date_str = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        rand_suffix = secrets.token_hex(2).upper()
        return f"PUB-{outlet_code}-{date_str}-{rand_suffix}"

    @staticmethod
    def create_order_from_cart(db: Session, req: OrderCreateRequest) -> Order:
        # 1. Fetch Cart and Calculate Valid Financials
        cart = db.query(Cart).filter(Cart.session_id == req.session_id).first()
        if not cart or not cart.items:
            raise ValueError("Cart is empty. Please add items before checking out.")
            
        outlet = None
        if req.outlet_id and req.outlet_id != "default-outlet":
            outlet = db.query(Outlet).filter(
                (Outlet.id == req.outlet_id) | (Outlet.code == req.outlet_id)
            ).first()
        if not outlet:
            outlet = db.query(Outlet).filter(Outlet.is_active == True).first()
        if not outlet:
            outlet = db.query(Outlet).first()
        if not outlet:
            raise ValueError("No active restaurant outlet configured.")
            
        cart_calc = CartService.calculate_cart_details(db, req.session_id)
        if not cart_calc["items"]:
            raise ValueError("No valid items found in cart.")
            
        # 2. Check Alcohol Compliance
        has_alcohol = any(i["is_alcohol"] for i in cart_calc["items"])
        if has_alcohol:
            if not outlet.alcohol_service_enabled:
                raise ValueError("Alcohol service is currently disabled at this outlet.")
            if not req.age_verified:
                raise ValueError(f"Age verification required. You must be at least {outlet.legal_drinking_age} years of age to order alcoholic beverages.")

        # 3. Create Order Header
        order_number = OrderService.generate_order_number(outlet.code)
        
        # Determine initial payment status based on chosen method
        initial_payment_status = PaymentStatusEnum.PENDING
        if req.payment_method.value == "COUNTER_BILLING":
            initial_payment_status = PaymentStatusEnum.PAY_AT_COUNTER
            
        food_subtotal = float(cart_calc.get("food_subtotal", 0.0))
        beverage_subtotal = float(cart_calc.get("beverage_subtotal", 0.0))

        initial_food_status = "PENDING_APPROVAL" if food_subtotal > 0 else "NOT_ORDERED"
        initial_bev_status = "PENDING_APPROVAL" if beverage_subtotal > 0 else "NOT_ORDERED"

        # Check assigned waiter on table if table specified
        assigned_waiter_id = None
        assigned_waiter_name = None
        target_table_number = req.table_number or cart.table_number
        if target_table_number:
            cands = [target_table_number, target_table_number.replace("T-", "").replace("T", "").strip()]
            tbl = db.query(RestaurantTable).filter(RestaurantTable.table_number.in_(cands)).first()
            if tbl:
                assigned_waiter_id = tbl.assigned_waiter_id
                assigned_waiter_name = tbl.assigned_waiter_name

        # Customer association for order history
        cust_id = None
        if req.customer_phone:
            clean_phone = req.customer_phone.strip()
            stripped_phone = clean_phone.replace("+91", "").replace(" ", "").strip()
            cust = db.query(Customer).filter(
                (Customer.phone == clean_phone) |
                (Customer.phone == stripped_phone) |
                (Customer.phone == f"+91{stripped_phone}")
            ).first()
            if cust:
                cust_id = cust.id
                if req.customer_name and (not cust.full_name or cust.full_name == "Guest Diner"):
                    cust.full_name = req.customer_name
            else:
                cust = Customer(
                    phone=clean_phone,
                    full_name=req.customer_name or "Valued Guest",
                    is_guest=False,
                    loyalty_points=10
                )
                db.add(cust)
                db.flush()
                cust_id = cust.id

        order = Order(
            order_number=order_number,
            customer_id=cust_id,
            outlet_id=outlet.id,
            dining_channel=req.dining_channel,
            table_number=target_table_number,
            qr_session_id=req.qr_session_id or cart.qr_session_id,
            order_status=OrderStatusEnum.PLACED,
            payment_status=initial_payment_status,
            payment_method=req.payment_method,
            subtotal=cart_calc["subtotal"],
            food_subtotal=food_subtotal,
            beverage_subtotal=beverage_subtotal,
            cgst=cart_calc["cgst"],
            sgst=cart_calc["sgst"],
            packaging_fee=cart_calc["packaging_fee"],
            delivery_fee=cart_calc["delivery_fee"],
            discount_amount=cart_calc["discount_amount"],
            final_amount=cart_calc["final_amount"],
            estimated_prep_time_minutes=25 if has_alcohol else 20,
            food_status=initial_food_status,
            beverage_status=initial_bev_status,
            waiter_id=assigned_waiter_id,
            waiter_name=assigned_waiter_name,
            special_instructions=req.special_instructions,
            customer_name=req.customer_name,
            customer_phone=req.customer_phone,
            delivery_address=req.delivery_address
        )
        db.add(order)
        db.flush()  # populate order.id

        # Mark table occupied with this active order
        if target_table_number:
            cands = [target_table_number, target_table_number.replace("T-", "").replace("T", "").strip()]
            tbl = db.query(RestaurantTable).filter(RestaurantTable.table_number.in_(cands)).first()
            if tbl:
                tbl.is_occupied = True
                tbl.current_order_id = order.id
        
        # 4. Copy line items with dual-business department tagging
        for ci in cart.items:
            m_item = db.query(MenuItem).filter(MenuItem.id == ci.item_id).first()
            if not m_item:
                continue
                
            variant_name = None
            if ci.variant:
                variant_name = ci.variant.name
                
            item_total = round(ci.unit_price * ci.quantity, 2)
            dept = determine_item_department(m_item)
            
            order_item = OrderItem(
                order_id=order.id,
                item_id=m_item.id,
                item_name=m_item.name,
                variant_name=variant_name,
                department=dept,
                item_status="PENDING",
                quantity=ci.quantity,
                unit_price=ci.unit_price,
                total_price=item_total,
                selected_addons=ci.selected_addons or [],
                special_request=ci.special_request,
                kitchen_station="BAR_STATION" if dept == "BEVERAGE" else (m_item.kitchen_station or "MAIN_KITCHEN")
            )
            db.add(order_item)
            
        # 5. Create Status History Record
        history = OrderStatusHistory(
            order_id=order.id,
            status=OrderStatusEnum.PLACED,
            notes="Order placed by customer via digital customer portal."
        )
        db.add(history)
        
        # 6. POS Outbox Event for Future Restaurant POS Integration
        pos_payload = {
            "event_type": "customer.order.created",
            "order_id": order.id,
            "order_number": order.order_number,
            "outlet_code": outlet.code,
            "outlet_name": outlet.name,
            "table_number": order.table_number,
            "dining_channel": order.dining_channel.value,
            "final_amount": order.final_amount,
            "items_count": len(cart.items),
            "created_at": datetime.datetime.now().isoformat()
        }
        outbox_event = PosOutboxEvent(
            event_type="customer.order.created",
            order_id=order.id,
            outlet_id=outlet.id,
            payload=pos_payload,
            is_processed=False
        )
        db.add(outbox_event)
        
        # 7. Clear Cart
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
        db.refresh(order)
        
        return order

    @staticmethod
    def update_order_status(db: Session, order_id: str, new_status: OrderStatusEnum, notes: Optional[str] = None) -> Order:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError(f"Order '{order_id}' not found.")
            
        order.order_status = new_status
        if new_status == OrderStatusEnum.ACCEPTED:
            order.food_status = "PREPARING"
            order.beverage_status = "PREPARING"
        elif new_status == OrderStatusEnum.PREPARING:
            order.food_status = "PREPARING"
        elif new_status == OrderStatusEnum.READY:
            order.food_status = "READY"
            order.beverage_status = "READY"
        elif new_status == OrderStatusEnum.SERVED:
            order.food_status = "SERVED"
            order.beverage_status = "SERVED"
            
        history = OrderStatusHistory(
            order_id=order.id,
            status=new_status,
            notes=notes or f"Order advanced to {new_status.value}"
        )
        db.add(history)
        
        # POS Outbox Event
        outbox_event = PosOutboxEvent(
            event_type=f"customer.order.{new_status.value.lower()}",
            order_id=order.id,
            outlet_id=order.outlet_id,
            payload={"order_number": order.order_number, "status": new_status.value},
            is_processed=False
        )
        db.add(outbox_event)
        
        db.commit()
        db.refresh(order)
        return order
