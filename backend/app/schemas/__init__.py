from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models import (
    DiningChannelEnum, OrderStatusEnum, PaymentStatusEnum, 
    PaymentMethodEnum, ReservationStatusEnum
)

# --- BASE & HEALTH ---
class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    database: str
    timestamp: str

# --- OUTLETS & RESTAURANT ---
class OperatingHoursSchema(BaseModel):
    day_of_week: str
    open_time: str
    close_time: str
    is_closed: bool

class DiningAreaSchema(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_outdoor: bool

class OutletSchema(BaseModel):
    id: str
    name: str
    code: str
    address: str
    city: str
    state: str
    postal_code: str
    phone: str
    email: str
    latitude: Optional[float]
    longitude: Optional[float]
    google_maps_url: Optional[str]
    is_active: bool
    alcohol_service_enabled: bool
    legal_drinking_age: int
    dining_areas: List[DiningAreaSchema] = []
    operating_hours: List[OperatingHoursSchema] = []

    class Config:
        from_attributes = True

class RestaurantSchema(BaseModel):
    id: str
    name: str
    legal_name: str
    gstin: str
    brand_tagline: str
    logo_url: str
    outlets: List[OutletSchema] = []

    class Config:
        from_attributes = True

# --- QR & TABLE SESSIONS ---
class TableQrValidateRequest(BaseModel):
    token: str = Field(..., description="The secure cryptographic QR token scanned by the camera")

class TableContextResponse(BaseModel):
    is_valid: bool
    outlet_id: str
    outlet_name: str
    outlet_code: str
    table_id: str
    table_number: str
    dining_area: Optional[str] = None
    session_token: str
    alcohol_service_enabled: bool
    legal_drinking_age: int
    message: str

class QrGenerateRequest(BaseModel):
    outlet_id: str
    table_number: str

class QrGenerateResponse(BaseModel):
    outlet_id: str
    table_number: str
    token: str
    universal_url: str
    native_deep_link: str
    qr_svg: Optional[str] = None

# --- MENU DOMAIN ---
class MenuVariantSchema(BaseModel):
    id: str
    name: str
    price_delta: float
    is_default: bool

    class Config:
        from_attributes = True

class MenuAddonSchema(BaseModel):
    id: str
    name: str
    price: float
    is_available: bool

    class Config:
        from_attributes = True

class ItemAllergenSchema(BaseModel):
    allergen_name: str

    class Config:
        from_attributes = True

class MenuItemSchema(BaseModel):
    id: str
    category_id: str
    name: str
    slug: str
    description: Optional[str] = None
    base_price: float
    is_veg: bool = True
    is_alcohol: bool = False
    alcohol_abv: Optional[float] = None
    serving_size: Optional[str] = None
    is_bestseller: bool = False
    is_signature: bool = False
    preparation_time_minutes: int = 15
    image_url: Optional[str] = None
    is_available: bool = True
    kitchen_station: Optional[str] = "Main Kitchen"
    variants: List[MenuVariantSchema] = []
    addons: List[MenuAddonSchema] = []
    allergens: List[ItemAllergenSchema] = []

    class Config:
        from_attributes = True

class MenuCategorySchema(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    display_order: int
    image_url: Optional[str]
    is_alcohol: bool
    is_active: bool
    items: List[MenuItemSchema] = []

    class Config:
        from_attributes = True

# --- CART DOMAIN ---
class CartItemAddRequest(BaseModel):
    item_id: str
    variant_id: Optional[str] = None
    quantity: int = Field(1, ge=1)
    selected_addon_ids: List[str] = []
    special_request: Optional[str] = None

class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=0)
    special_request: Optional[str] = None

class CartItemDetailSchema(BaseModel):
    id: str
    item_id: str
    item_name: str
    item_image: Optional[str]
    is_veg: bool
    is_alcohol: bool
    variant_id: Optional[str]
    variant_name: Optional[str]
    quantity: int
    unit_price: float
    selected_addons: List[Dict[str, Any]] = []
    total_price: float
    special_request: Optional[str]

class CartDetailResponse(BaseModel):
    session_id: str
    outlet_id: str
    outlet_name: Optional[str]
    table_number: Optional[str]
    dining_channel: DiningChannelEnum
    items: List[CartItemDetailSchema]
    item_count: int
    subtotal: float
    cgst: float
    sgst: float
    total_tax: float
    packaging_fee: float
    delivery_fee: float
    discount_amount: float
    final_amount: float

# --- ORDERS & CHECKOUT ---
class OrderCreateRequest(BaseModel):
    session_id: str
    outlet_id: str
    dining_channel: DiningChannelEnum
    table_number: Optional[str] = None
    qr_session_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    special_instructions: Optional[str] = None
    payment_method: PaymentMethodEnum
    # Age verification confirmation for alcohol
    age_verified: bool = False

class OrderItemSchema(BaseModel):
    id: str
    item_id: str
    item_name: str
    variant_name: Optional[str]
    quantity: int
    unit_price: float
    total_price: float
    selected_addons: List[Dict[str, Any]] = []
    special_request: Optional[str]
    kitchen_station: str

    class Config:
        from_attributes = True

class OrderStatusHistorySchema(BaseModel):
    status: OrderStatusEnum
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    order_number: str
    outlet_id: str
    outlet_name: Optional[str] = "PUBLIQ HARAGADDE"
    table_number: Optional[str] = None
    dining_channel: DiningChannelEnum
    order_status: OrderStatusEnum
    payment_status: PaymentStatusEnum
    payment_method: PaymentMethodEnum
    subtotal: float
    cgst: float
    sgst: float
    packaging_fee: float
    delivery_fee: float
    discount_amount: float
    final_amount: float
    estimated_prep_time_minutes: int
    food_status: str
    beverage_status: str
    special_instructions: Optional[str]
    customer_name: Optional[str]
    customer_phone: Optional[str]
    delivery_address: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemSchema]
    status_history: List[OrderStatusHistorySchema] = []

    class Config:
        from_attributes = True

# --- PAYMENTS ---
class PaymentInitiateRequest(BaseModel):
    order_id: str
    payment_method: PaymentMethodEnum

class PaymentInitiateResponse(BaseModel):
    payment_id: str
    order_id: str
    amount: float
    currency: str = "INR"
    status: PaymentStatusEnum
    gateway_name: str
    transaction_ref: str
    checkout_url: Optional[str] = None
    instructions: Optional[str] = None

class PaymentVerifyRequest(BaseModel):
    payment_id: str
    transaction_ref: str
    provider_signature: Optional[str] = None
    simulated_success: bool = True

class PaymentVerifyResponse(BaseModel):
    success: bool
    order_id: str
    order_number: str
    payment_status: PaymentStatusEnum
    order_status: OrderStatusEnum
    message: str

# --- CUSTOMER & AUTH ---
class CustomerRegisterRequest(BaseModel):
    phone: str
    full_name: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class CustomerLoginRequest(BaseModel):
    phone_or_email: str
    password: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer_id: str
    full_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    loyalty_points: int

class CustomerProfileResponse(BaseModel):
    id: str
    full_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    loyalty_points: int
    created_at: datetime
    recent_orders: List[OrderResponse] = []

# --- RESERVATIONS ---
class ReservationCreateRequest(BaseModel):
    outlet_id: Optional[str] = None
    guest_name: str
    guest_phone: str
    guest_email: Optional[EmailStr] = None
    guest_count: int = Field(2, ge=1, le=50)
    reservation_date: str = Field(..., description="YYYY-MM-DD")
    time_slot: str = Field(..., description="e.g. 19:30")
    seating_preference: str = "GARDEN"
    special_requests: Optional[str] = None

class ReservationResponse(BaseModel):
    id: str
    reservation_ref: str
    outlet_name: str
    guest_name: str
    guest_phone: str
    guest_count: int
    reservation_date: str
    time_slot: str
    seating_preference: str
    status: ReservationStatusEnum
    special_requests: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- POS INTEGRATION ---
class PosOrderEventPayload(BaseModel):
    event_type: str
    order_id: str
    order_number: str
    outlet_code: str
    table_number: Optional[str]
    dining_channel: str
    order_status: str
    payment_status: str
    final_amount: float
    items: List[Dict[str, Any]]
    created_at: str
