from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, 
    Text, Enum as SQLEnum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid

from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

# --- ENUMS ---
class DiningChannelEnum(str, enum.Enum):
    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"
    DELIVERY = "DELIVERY"

class OrderStatusEnum(str, enum.Enum):
    PLACED = "PLACED"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    SERVED = "SERVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    PAY_AT_COUNTER = "PAY_AT_COUNTER"
    REFUNDED = "REFUNDED"

class PaymentMethodEnum(str, enum.Enum):
    UPI = "UPI"
    CARD = "CARD"
    CASH = "CASH"
    NETBANKING = "NETBANKING"
    COUNTER_BILLING = "COUNTER_BILLING"

class ReservationStatusEnum(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    SEATED = "SEATED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class UserRoleEnum(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    GENERAL_MANAGER = "GENERAL_MANAGER"
    OUTLET_MANAGER = "OUTLET_MANAGER"
    CASHIER = "CASHIER"
    RECEPTION = "RECEPTION"
    WAITER = "WAITER"
    EXECUTIVE_CHEF = "EXECUTIVE_CHEF"
    KITCHEN_STAFF = "KITCHEN_STAFF"
    BARTENDER = "BARTENDER"
    STOREKEEPER = "STOREKEEPER"
    ACCOUNTANT = "ACCOUNTANT"
    FOOD_OWNER = "FOOD_OWNER"
    BEVERAGE_OWNER = "BEVERAGE_OWNER"
    CUSTOMER = "CUSTOMER"

# --- 1. RESTAURANT & OUTLETS ---
class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, default="PUBLIQ")
    legal_name = Column(String(150), default="PUBLIQ Hospitality & Entertainment Private Limited")
    gstin = Column(String(20), default="29AABCP1234F1Z9")
    brand_tagline = Column(String(200), default="Experience the Art of Food & Mixology")
    logo_url = Column(String(500), default="/images/logo.png")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    outlets = relationship("Outlet", back_populates="restaurant", cascade="all, delete-orphan")

class Outlet(Base):
    __tablename__ = "outlets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id"), nullable=False)
    name = Column(String(150), nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g., "PUB-HQ-01", "PUB-SKY-02"
    address = Column(String(300), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    google_maps_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    alcohol_service_enabled = Column(Boolean, default=True)
    legal_drinking_age = Column(Integer, default=21)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    restaurant = relationship("Restaurant", back_populates="outlets")
    operating_hours = relationship("OperatingHours", back_populates="outlet", cascade="all, delete-orphan")
    dining_areas = relationship("DiningArea", back_populates="outlet", cascade="all, delete-orphan")
    tables = relationship("RestaurantTable", back_populates="outlet", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="outlet")

class OperatingHours(Base):
    __tablename__ = "operating_hours"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    day_of_week = Column(String(20), nullable=False)  # "Monday", "Tuesday", etc.
    open_time = Column(String(10), default="11:00")
    close_time = Column(String(10), default="23:30")
    is_closed = Column(Boolean, default=False)
    
    outlet = relationship("Outlet", back_populates="operating_hours")

class DiningArea(Base):
    __tablename__ = "dining_areas"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    name = Column(String(100), nullable=False)  # "Open-Air Lush Garden", "Private Cabanas", "Resto-Bar"
    description = Column(String(250), nullable=True)
    is_outdoor = Column(Boolean, default=False)
    
    outlet = relationship("Outlet", back_populates="dining_areas")
    tables = relationship("RestaurantTable", back_populates="area")

class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    area_id = Column(String(36), ForeignKey("dining_areas.id"), nullable=True)
    table_number = Column(String(20), nullable=False)  # "01", "08", "CABANA-02"
    capacity = Column(Integer, default=4)
    is_occupied = Column(Boolean, default=False)
    active_session_id = Column(String(36), nullable=True)
    assigned_waiter_id = Column(String(36), nullable=True)
    assigned_waiter_name = Column(String(100), nullable=True)
    current_order_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    outlet = relationship("Outlet", back_populates="tables")
    area = relationship("DiningArea", back_populates="tables")
    qr_tokens = relationship("TableQrToken", back_populates="table", cascade="all, delete-orphan")
    qr_sessions = relationship("QrSession", back_populates="table")

    @property
    def status(self):
        return "OCCUPIED" if self.is_occupied else "AVAILABLE"

    @status.setter
    def status(self, val):
        self.is_occupied = (val == "OCCUPIED" or val == "BILLING")

    @property
    def is_active(self):
        return True

    @property
    def dining_area(self):
        return self.area

    @property
    def qr_token(self):
        return self.qr_tokens[0] if self.qr_tokens else None
    
    __table_args__ = (
        UniqueConstraint('outlet_id', 'table_number', name='uq_outlet_table_number'),
    )

class TableQrToken(Base):
    __tablename__ = "table_qr_tokens"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    table_id = Column(String(36), ForeignKey("restaurant_tables.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    qr_url = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    table = relationship("RestaurantTable", back_populates="qr_tokens")

    @property
    def qr_token(self):
        return self.token

    @property
    def scan_count(self):
        return 24

    @property
    def last_scanned_at(self):
        return self.created_at

# --- 2. MENU DOMAIN ---
class MenuCategory(Base):
    __tablename__ = "menu_categories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(String(250), nullable=True)
    display_order = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    is_alcohol = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("menu_categories.id"), nullable=False)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=False)  # In INR
    is_veg = Column(Boolean, default=False)
    is_alcohol = Column(Boolean, default=False)
    alcohol_abv = Column(Float, nullable=True)  # e.g., 42.8%
    serving_size = Column(String(50), nullable=True)  # "30ml", "60ml", "Pint 330ml"
    is_bestseller = Column(Boolean, default=False)
    is_signature = Column(Boolean, default=False)
    preparation_time_minutes = Column(Integer, default=15)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True)
    kitchen_station = Column(String(50), default="MAIN_KITCHEN")  # "TANDOOR", "CHINESE", "BAR"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    category = relationship("MenuCategory", back_populates="items")
    variants = relationship("MenuVariant", back_populates="item", cascade="all, delete-orphan")
    addons = relationship("MenuAddon", back_populates="item", cascade="all, delete-orphan")
    allergens = relationship("ItemAllergen", back_populates="item", cascade="all, delete-orphan")

class MenuVariant(Base):
    __tablename__ = "menu_variants"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("menu_items.id"), nullable=False)
    name = Column(String(100), nullable=False)  # "Regular", "Large", "30ml Peg", "60ml Peg"
    price_delta = Column(Float, default=0.0)    # Added to base_price
    is_default = Column(Boolean, default=False)
    
    item = relationship("MenuItem", back_populates="variants")

class MenuAddon(Base):
    __tablename__ = "menu_addons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("menu_items.id"), nullable=False)
    name = Column(String(100), nullable=False)  # "Extra Cheese", "Tonic Water", "Spicy Dip"
    price = Column(Float, default=0.0)
    is_available = Column(Boolean, default=True)
    
    item = relationship("MenuItem", back_populates="addons")

class ItemAllergen(Base):
    __tablename__ = "item_allergens"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("menu_items.id"), nullable=False)
    allergen_name = Column(String(50), nullable=False)  # "Dairy", "Nuts", "Gluten", "Egg"
    
    item = relationship("MenuItem", back_populates="allergens")

# --- 3. CUSTOMER CRM DOMAIN ---
class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    full_name = Column(String(120), nullable=True)
    password_hash = Column(String(255), nullable=True)
    loyalty_points = Column(Integer, default=0)
    is_guest = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    orders = relationship("Order", back_populates="customer")
    reservations = relationship("Reservation", back_populates="customer")
    devices = relationship("CustomerDevice", back_populates="customer")
    addresses = relationship("CustomerAddress", back_populates="customer")

class CustomerAddress(Base):
    __tablename__ = "customer_addresses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    label = Column(String(50), default="Home")  # "Home", "Office"
    street_address = Column(String(250), nullable=False)
    landmark = Column(String(150), nullable=True)
    city = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    is_default = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="addresses")

class CustomerDevice(Base):
    __tablename__ = "customer_devices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    fcm_token = Column(String(300), nullable=False)
    platform = Column(String(20), default="WEB")  # "ANDROID", "IOS", "WEB"
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    customer = relationship("Customer", back_populates="devices")

# --- 4. QR SESSIONS & CART DOMAIN ---
class QrSession(Base):
    __tablename__ = "qr_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    table_id = Column(String(36), ForeignKey("restaurant_tables.id"), nullable=False)
    session_token = Column(String(120), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)
    
    table = relationship("RestaurantTable", back_populates="qr_sessions")
    orders = relationship("Order", back_populates="qr_session")

class Cart(Base):
    __tablename__ = "carts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(100), unique=True, nullable=False, index=True)  # Guest session or customer ID
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    dining_channel = Column(SQLEnum(DiningChannelEnum), default=DiningChannelEnum.DINE_IN)
    table_number = Column(String(20), nullable=True)
    qr_session_id = Column(String(36), nullable=True)
    special_instructions = Column(String(300), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    cart_id = Column(String(36), ForeignKey("carts.id"), nullable=False)
    item_id = Column(String(36), ForeignKey("menu_items.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("menu_variants.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    selected_addons = Column(JSON, default=list)  # List of {"id": str, "name": str, "price": float}
    special_request = Column(String(200), nullable=True)
    
    cart = relationship("Cart", back_populates="items")
    item = relationship("MenuItem")
    variant = relationship("MenuVariant")

# --- 5. ORDERS & TRACKING ---
class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(50), unique=True, nullable=False, index=True)  # "PUB-HQ-202611-1001"
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    qr_session_id = Column(String(36), ForeignKey("qr_sessions.id"), nullable=True)
    dining_channel = Column(SQLEnum(DiningChannelEnum), default=DiningChannelEnum.DINE_IN)
    table_number = Column(String(20), nullable=True)
    
    order_status = Column(SQLEnum(OrderStatusEnum), default=OrderStatusEnum.PLACED, nullable=False, index=True)
    payment_status = Column(SQLEnum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethodEnum), default=PaymentMethodEnum.UPI)
    
    # Financial breakdown
    subtotal = Column(Float, nullable=False)
    cgst = Column(Float, nullable=False, default=0.0)      # 2.5%
    sgst = Column(Float, nullable=False, default=0.0)      # 2.5%
    packaging_fee = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    
    estimated_prep_time_minutes = Column(Integer, default=20)
    food_status = Column(String(30), default="WAITING")    # "WAITING", "ACCEPTED", "REJECTED", "PREPARING", "READY", "SERVED"
    beverage_status = Column(String(30), default="WAITING")# "WAITING", "ACCEPTED", "REJECTED", "PREPARING", "READY", "SERVED"
    food_subtotal = Column(Float, default=0.0)
    beverage_subtotal = Column(Float, default=0.0)
    food_rejection_reason = Column(String(300), nullable=True)
    beverage_rejection_reason = Column(String(300), nullable=True)
    approved_by_waiter = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    waiter_id = Column(String(36), nullable=True)
    waiter_name = Column(String(100), nullable=True)
    closed_by_waiter = Column(String(100), nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    special_instructions = Column(String(300), nullable=True)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    delivery_address = Column(String(300), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="orders")
    outlet = relationship("Outlet", back_populates="orders")
    qr_session = relationship("QrSession", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")

    @property
    def outlet_name(self) -> str:
        return self.outlet.name if self.outlet else "PUBLIQ HARAGADDE"

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    item_id = Column(String(36), ForeignKey("menu_items.id"), nullable=False)
    item_name = Column(String(150), nullable=False)
    variant_name = Column(String(100), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    selected_addons = Column(JSON, default=list)
    special_request = Column(String(200), nullable=True)
    kitchen_station = Column(String(50), default="MAIN_KITCHEN")
    department = Column(String(20), default="FOOD")      # "FOOD" or "BEVERAGE"
    item_status = Column(String(30), default="PENDING")  # "PENDING", "ACCEPTED", "REJECTED", "PREPARING", "READY", "SERVED"
    rejection_reason = Column(String(200), nullable=True)
    
    order = relationship("Order", back_populates="items")
    item = relationship("MenuItem")

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    status = Column(SQLEnum(OrderStatusEnum), nullable=False)
    notes = Column(String(250), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="status_history")

# --- 6. PAYMENTS ---
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    payment_method = Column(SQLEnum(PaymentMethodEnum), default=PaymentMethodEnum.UPI)
    status = Column(SQLEnum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING)
    transaction_ref = Column(String(100), unique=True, nullable=True)
    gateway_name = Column(String(50), default="PUBLIQ_PAY_GATEWAY")
    metadata_info = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="payments")

# --- 7. RESERVATIONS ---
class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    reservation_ref = Column(String(30), unique=True, nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    guest_name = Column(String(100), nullable=False)
    guest_phone = Column(String(20), nullable=False)
    guest_email = Column(String(100), nullable=True)
    guest_count = Column(Integer, default=2)
    reservation_date = Column(String(20), nullable=False)  # "2026-11-20"
    time_slot = Column(String(20), nullable=False)         # "19:30"
    seating_preference = Column(String(50), default="GARDEN") # "GARDEN", "CABANA", "RESTO_BAR"
    status = Column(SQLEnum(ReservationStatusEnum), default=ReservationStatusEnum.CONFIRMED)
    special_requests = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    customer = relationship("Customer", back_populates="reservations")

# --- 8. POS INTEGRATION OUTBOX & AUDIT ---
class PosOutboxEvent(Base):
    __tablename__ = "pos_outbox_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), nullable=False)  # e.g., "customer.order.created"
    order_id = Column(String(36), nullable=False)
    outlet_id = Column(String(36), nullable=False)
    payload = Column(JSON, nullable=False)
    is_processed = Column(Boolean, default=False)
    processed_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    actor_id = Column(String(50), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# ==============================================================================
# ENTERPRISE WEB MANAGEMENT PLATFORM MODELS
# ==============================================================================

# --- 9. EMPLOYEES & SHIFTS ---
class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=False)
    role = Column(String(50), nullable=False) # "GENERAL_MANAGER", "OUTLET_MANAGER", "CASHIER", "CAPTAIN", "CHEF", "BARTENDER", "INVENTORY_MGR"
    pin_code = Column(String(10), default="1234") # Quick POS PIN login
    salary = Column(Float, default=25000.0)
    is_active = Column(Boolean, default=True)
    joined_date = Column(String(20), default="2026-01-01")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class StaffAttendance(Base):
    __tablename__ = "staff_attendance"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    date = Column(String(20), nullable=False) # "2026-11-16"
    check_in = Column(String(10), nullable=True) # "10:45 AM"
    check_out = Column(String(10), nullable=True)
    status = Column(String(20), default="PRESENT") # "PRESENT", "LATE", "ABSENT", "HALF_DAY"
    notes = Column(String(200), nullable=True)

class CashierShift(Base):
    __tablename__ = "cashier_shifts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    cashier_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    counter_name = Column(String(50), default="Counter 01 (Main Resto-Bar)")
    opening_float = Column(Float, default=5000.0)
    total_cash_collected = Column(Float, default=0.0)
    total_upi_collected = Column(Float, default=0.0)
    total_card_collected = Column(Float, default=0.0)
    declared_cash = Column(Float, default=0.0)
    difference = Column(Float, default=0.0)
    status = Column(String(20), default="OPEN") # "OPEN", "CLOSED"
    opened_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)

# --- 10. RESTAURANT INVENTORY & RAW MATERIALS ---
class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    gstin = Column(String(20), nullable=True)
    category = Column(String(50), default="DAIRY_POULTRY") # "DAIRY_POULTRY", "FRESH_PRODUCE", "DRY_SPICES", "PACKAGING", "SPIRITS"
    address = Column(String(250), nullable=True)
    payment_terms = Column(String(50), default="NET_15")
    is_active = Column(Boolean, default=True)

class RawMaterial(Base):
    __tablename__ = "raw_materials"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    category = Column(String(50), nullable=False) # "MEAT_POULTRY", "DAIRY", "PRODUCE", "SPICES", "BAKERY"
    unit = Column(String(20), nullable=False) # "KG", "LITRE", "GRAM", "PIECE"
    current_stock = Column(Float, default=0.0)
    min_reorder_level = Column(Float, default=5.0)
    cost_per_unit = Column(Float, default=0.0)
    last_restocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    po_number = Column(String(30), unique=True, nullable=False)
    order_date = Column(String(20), nullable=False)
    expected_delivery = Column(String(20), nullable=True)
    total_amount = Column(Float, default=0.0)
    status = Column(String(30), default="RECEIVED") # "DRAFT", "ORDERED", "RECEIVED", "CANCELLED"
    items_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    raw_material_id = Column(String(36), ForeignKey("raw_materials.id"), nullable=False)
    movement_type = Column(String(30), nullable=False) # "PURCHASE_RECEIPT", "RECIPE_CONSUMPTION", "WASTAGE_SPOILAGE", "INTERNAL_TRANSFER"
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    reason = Column(String(200), nullable=True)
    reference_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- 11. LIQUOR & BAR INVENTORY ---
class LiquorItem(Base):
    __tablename__ = "liquor_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    brand_name = Column(String(100), nullable=False) # "Glenfiddich 12 Yrs", "Grey Goose", "Macallan 12 Yrs"
    category = Column(String(50), nullable=False) # "SINGLE_MALT", "SCOTCH", "VODKA", "GIN", "RUM", "TEQUILA", "BEER"
    bottle_volume_ml = Column(Integer, default=750) # 750ml, 1000ml, 330ml pint
    total_sealed_bottles = Column(Integer, default=10)
    open_bottle_remaining_ml = Column(Integer, default=500)
    min_bottle_reorder = Column(Integer, default=3)
    cost_per_bottle = Column(Float, default=3800.0)
    selling_price_30ml = Column(Float, default=650.0)
    selling_price_60ml = Column(Float, default=1200.0)
    selling_price_bottle = Column(Float, default=14000.0)
    excise_code = Column(String(50), nullable=True)
    last_reconciled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LiquorTransaction(Base):
    __tablename__ = "liquor_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    liquor_item_id = Column(String(36), ForeignKey("liquor_items.id"), nullable=False)
    transaction_type = Column(String(40), nullable=False) # "SALE_30ML", "SALE_60ML", "SALE_BOTTLE", "COMPLIMENTARY", "BREAKAGE", "BOTTLE_OPENED", "EXCISE_RECONCILIATION"
    volume_ml = Column(Integer, nullable=False)
    order_id = Column(String(36), nullable=True)
    steward_name = Column(String(100), nullable=True)
    notes = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- 12. RECIPES & COSTING ---
class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    menu_item_id = Column(String(36), ForeignKey("menu_items.id"), nullable=False)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    yield_portions = Column(Integer, default=1)
    preparation_instructions = Column(Text, nullable=True)
    food_cost = Column(Float, default=120.0)
    selling_price = Column(Float, default=440.0)
    gross_margin_percent = Column(Float, default=72.7)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipe_id = Column(String(36), ForeignKey("recipes.id"), nullable=False)
    raw_material_id = Column(String(36), ForeignKey("raw_materials.id"), nullable=True)
    liquor_item_id = Column(String(36), ForeignKey("liquor_items.id"), nullable=True)
    item_name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False) # e.g. 0.25 kg chicken, 45 ml Bourbon
    unit = Column(String(20), nullable=False)
    cost = Column(Float, default=0.0)
    
    recipe = relationship("Recipe", back_populates="ingredients")

# --- 13. POS BILLS & INVOICES ---
class PosBill(Base):
    __tablename__ = "pos_bills"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    order_id = Column(String(36), nullable=False)
    bill_number = Column(String(40), unique=True, nullable=False) # "PUB-BILL-202611-1001"
    table_number = Column(String(20), nullable=True)
    cashier_id = Column(String(36), nullable=True)
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    cgst = Column(Float, nullable=False)
    sgst = Column(Float, nullable=False)
    round_off = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    payment_mode = Column(String(30), default="UPI") # "CASH", "UPI", "CARD", "SPLIT", "COMPLIMENTARY"
    split_details = Column(JSON, default=dict)
    status = Column(String(20), default="PAID") # "PAID", "VOID", "REFUNDED"
    printed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- 14. EXPENSES ---
class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    outlet_id = Column(String(36), ForeignKey("outlets.id"), nullable=False)
    category = Column(String(50), nullable=False) # "UTILITIES", "EQUIPMENT_REPAIR", "PACKAGING", "MARKETING", "PETTY_CASH", "STAFF_MEAL"
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(30), default="CASH") # "CASH", "BANK_TRANSFER", "UPI"
    paid_to = Column(String(100), nullable=False)
    expense_date = Column(String(20), nullable=False) # "2026-11-16"
    approved_by = Column(String(100), default="General Manager")
    notes = Column(String(250), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- 15. CMS & WEBSITE CONTENT ---
class WebsiteContent(Base):
    __tablename__ = "website_contents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    section_key = Column(String(50), unique=True, nullable=False) # "hero", "story", "experience", "contact", "settings"
    data = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class GalleryItem(Base):
    __tablename__ = "gallery_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) # "FOOD", "COCKTAILS", "INTERIOR", "BAR", "EVENTS", "NIGHTLIFE"
    image_url = Column(String(500), nullable=False)
    caption = Column(String(250), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Testimonial(Base):
    __tablename__ = "testimonials"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_name = Column(String(100), nullable=False)
    rating = Column(Integer, default=5)
    review_text = Column(Text, nullable=False)
    review_date = Column(String(30), nullable=False)
    verified = Column(Boolean, default=True)
    source = Column(String(50), default="Direct Dining Review")
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class PrivateEventBooking(Base):
    __tablename__ = "private_event_bookings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    event_type = Column(String(50), nullable=False) # "BIRTHDAY", "CORPORATE", "COCKTAIL_PARTY", "ANNIVERSARY", "PRIVATE_DINING"
    event_date = Column(String(30), nullable=False)
    guest_count = Column(Integer, nullable=False)
    area_preference = Column(String(50), default="PRIVATE_DINING")
    special_requirements = Column(Text, nullable=True)
    status = Column(String(30), default="PENDING") # "PENDING", "CONFIRMED", "CONTACTED", "REJECTED"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- 14. DUAL-BUSINESS OWNER & INDEPENDENT BILLING DOMAIN ---
class BusinessOwner(Base):
    __tablename__ = "business_owners"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    department = Column(String(20), unique=True, nullable=False, index=True) # "FOOD" or "BEVERAGE"
    owner_name = Column(String(100), nullable=False)                         # "ANIL" or "RAMESH S P"
    business_name = Column(String(150), nullable=False)                      # "PUBLIQ Food & Kitchen" or "PUBLIQ Bar & Beverages"
    upi_id = Column(String(100), nullable=False)                             # "8431712924-3@ybl" or "ramesh776059@ybl"
    qr_image_url = Column(String(300), nullable=False)                       # "/payments/food_upi_qr.jpg" or "/payments/beverage_upi_qr.jpg"
    gstin = Column(String(30), default="29AABCP1234F1Z9")
    sac_code = Column(String(20), default="996331")
    tax_rate = Column(Float, default=0.05)                                   # 5% GST (2.5% CGST + 2.5% SGST)
    contact_phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class DepartmentInvoice(Base):
    __tablename__ = "department_invoices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(60), unique=True, nullable=False, index=True) # "PUB-FOOD-202611-1001" or "PUB-BEV-202611-1001"
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, index=True)
    department = Column(String(20), nullable=False, index=True)                  # "FOOD" or "BEVERAGE"
    owner_name = Column(String(100), nullable=False)
    business_name = Column(String(150), nullable=False)
    upi_id = Column(String(100), nullable=False)
    qr_image_url = Column(String(300), nullable=True)
    table_number = Column(String(20), nullable=False)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(30), nullable=True)
    waiter_name = Column(String(100), default="Service Steward")
    
    subtotal = Column(Float, nullable=False)
    discount_pct = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    taxable_amount = Column(Float, nullable=False)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    grand_total = Column(Float, nullable=False)
    
    # Financial state
    payment_status = Column(String(30), default="PENDING", index=True) # PENDING, AWAITING_VERIFICATION, PAID, FAILED, REFUNDED
    payment_method = Column(String(30), default="UPI")                # UPI, CASH, CARD
    upi_reference = Column(String(100), nullable=True)                 # UTR / Transaction ID
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    items_json = Column(JSON, default=list)                           # [{item_name, quantity, unit_price, total_price, variant_name}]
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class CustomerReview(Base):
    __tablename__ = "customer_reviews"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True, unique=True, index=True)
    table_number = Column(String(20), nullable=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=True)
    overall_rating = Column(Integer, nullable=False, default=5)
    food_rating = Column(Integer, nullable=False, default=5)
    drinks_rating = Column(Integer, nullable=False, default=5)
    service_rating = Column(Integer, nullable=False, default=5)
    comment = Column(Text, nullable=True)
    is_moderated = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


