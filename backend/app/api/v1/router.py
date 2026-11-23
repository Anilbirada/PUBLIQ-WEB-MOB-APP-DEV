from fastapi import APIRouter

from app.api.v1.endpoints import (
    restaurant, outlets, qr_sessions, menu, categories,
    products, cart, orders, order_tracking, payments,
    auth, customers, reservations, notifications, pos_integration,
    admin_pos, admin_operations, admin_inventory, admin_reports,
    experience, waiter, admin_owners, reviews, admin_staff_management
)

api_router = APIRouter()

# Customer & Public APIs
api_router.include_router(restaurant.router, prefix="/restaurant", tags=["Restaurant"])
api_router.include_router(outlets.router, prefix="/outlets", tags=["Outlets"])
api_router.include_router(qr_sessions.router, prefix="/qr-sessions", tags=["QR Sessions"])
api_router.include_router(menu.router, prefix="/menu", tags=["Digital Menu"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(cart.router, prefix="/cart", tags=["Shopping Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(order_tracking.router, prefix="/order-tracking", tags=["Order Tracking"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(reservations.router, prefix="/reservations", tags=["Reservations"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(pos_integration.router, prefix="/pos", tags=["POS & Kitchen Integration"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Customer Reviews"])

# Cinematic Experience, Events & AI Concierge APIs
api_router.include_router(experience.router, prefix="/experience", tags=["Experience Videos, Events & AI"])

# Enterprise Management APIs (Web Application Only)
api_router.include_router(admin_pos.router, prefix="/admin/pos", tags=["Enterprise POS & Billing"])
api_router.include_router(admin_operations.router, prefix="/admin/operations", tags=["Enterprise KOT & Bar KDS"])
api_router.include_router(admin_inventory.router, prefix="/admin/inventory", tags=["Enterprise Liquor & Kitchen Inventory"])
api_router.include_router(admin_reports.router, prefix="/admin/management", tags=["Enterprise Reports, Tables & Staff"])
api_router.include_router(admin_staff_management.router, prefix="/admin/management", tags=["Staff, Dynamic Roles, Attendance & Payroll"])
api_router.include_router(admin_staff_management.router, prefix="/admin/staff", tags=["Staff, Dynamic Roles, Attendance & Payroll"])
api_router.include_router(admin_owners.router, prefix="/admin/owners", tags=["Dual Business Owners"])

# Dedicated Waiter Mobile Operations API
api_router.include_router(waiter.router, prefix="/waiter", tags=["Dedicated Waiter Mobile Operations"])
