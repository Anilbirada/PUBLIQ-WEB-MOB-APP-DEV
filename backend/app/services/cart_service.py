from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models import Cart, CartItem, MenuItem, MenuVariant, MenuAddon, Outlet, DiningChannelEnum
from app.core.config import settings

class CartService:
    @staticmethod
    def get_or_create_cart(
        db: Session, 
        session_id: str, 
        outlet_id: str, 
        dining_channel: DiningChannelEnum = DiningChannelEnum.DINE_IN,
        table_number: Optional[str] = None,
        qr_session_id: Optional[str] = None
    ) -> Cart:
        cart = db.query(Cart).filter(Cart.session_id == session_id).first()
        if not cart:
            cart = Cart(
                session_id=session_id,
                outlet_id=outlet_id,
                dining_channel=dining_channel,
                table_number=table_number,
                qr_session_id=qr_session_id
            )
            db.add(cart)
            db.commit()
            db.refresh(cart)
        else:
            # Update dining context if specified
            if outlet_id and cart.outlet_id != outlet_id:
                cart.outlet_id = outlet_id
            if dining_channel:
                cart.dining_channel = dining_channel
            if table_number:
                cart.table_number = table_number
            if qr_session_id:
                cart.qr_session_id = qr_session_id
            db.commit()
            db.refresh(cart)
        return cart

    @staticmethod
    def add_item_to_cart(
        db: Session,
        cart_id: str,
        item_id: str,
        variant_id: Optional[str],
        quantity: int,
        selected_addon_ids: List[str],
        special_request: Optional[str] = None
    ) -> CartItem:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not menu_item or not menu_item.is_available:
            raise ValueError("Menu item not available or does not exist")
            
        unit_price = menu_item.base_price
        
        # Check variant delta
        if variant_id:
            variant = db.query(MenuVariant).filter(
                MenuVariant.id == variant_id,
                MenuVariant.item_id == item_id
            ).first()
            if variant:
                unit_price += variant.price_delta
                
        # Fetch addon details
        addons_data = []
        if selected_addon_ids:
            addons = db.query(MenuAddon).filter(
                MenuAddon.id.in_(selected_addon_ids),
                MenuAddon.item_id == item_id,
                MenuAddon.is_available == True
            ).all()
            for ad in addons:
                addons_data.append({
                    "id": ad.id,
                    "name": ad.name,
                    "price": float(ad.price)
                })
                unit_price += float(ad.price)

        # Check if identical item with same variant and addons already exists in cart
        existing_items = db.query(CartItem).filter(
            CartItem.cart_id == cart_id,
            CartItem.item_id == item_id,
            CartItem.variant_id == variant_id
        ).all()
        
        target_item = None
        for item in existing_items:
            existing_addon_ids = [a.get("id") for a in (item.selected_addons or [])]
            if sorted(existing_addon_ids) == sorted(selected_addon_ids):
                target_item = item
                break
                
        if target_item:
            target_item.quantity += quantity
            if special_request:
                target_item.special_request = special_request
            db.commit()
            db.refresh(target_item)
            return target_item
        else:
            new_item = CartItem(
                cart_id=cart_id,
                item_id=item_id,
                variant_id=variant_id,
                quantity=quantity,
                unit_price=unit_price,
                selected_addons=addons_data,
                special_request=special_request
            )
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            return new_item

    @staticmethod
    def calculate_cart_details(db: Session, session_id: str) -> Dict[str, Any]:
        """
        Recalculates all cart items and totals server-side.
        Applies GST (2.5% CGST + 2.5% SGST) and optional packaging/delivery fees.
        """
        cart = db.query(Cart).filter(Cart.session_id == session_id).first()
        if not cart:
            return {
                "session_id": session_id,
                "outlet_id": "",
                "outlet_name": "",
                "table_number": None,
                "dining_channel": DiningChannelEnum.DINE_IN,
                "items": [],
                "item_count": 0,
                "subtotal": 0.0,
                "cgst": 0.0,
                "sgst": 0.0,
                "total_tax": 0.0,
                "packaging_fee": 0.0,
                "delivery_fee": 0.0,
                "discount_amount": 0.0,
                "final_amount": 0.0
            }
            
        outlet = db.query(Outlet).filter(Outlet.id == cart.outlet_id).first()
        outlet_name = outlet.name if outlet else "PUBLIQ Flagship"
        
        items_detail = []
        subtotal = 0.0
        total_items_count = 0
        
        for item in cart.items:
            m_item = db.query(MenuItem).filter(MenuItem.id == item.item_id).first()
            if not m_item:
                continue
            
            variant = db.query(MenuVariant).filter(MenuVariant.id == item.variant_id).first() if item.variant_id else None
            variant_name = variant.name if variant else None
            
            item_total = round(item.unit_price * item.quantity, 2)
            subtotal += item_total
            total_items_count += item.quantity
            
            items_detail.append({
                "id": item.id,
                "item_id": item.item_id,
                "item_name": m_item.name,
                "item_image": m_item.image_url,
                "is_veg": m_item.is_veg,
                "is_alcohol": m_item.is_alcohol,
                "variant_id": item.variant_id,
                "variant_name": variant_name,
                "quantity": item.quantity,
                "unit_price": round(item.unit_price, 2),
                "selected_addons": item.selected_addons or [],
                "total_price": item_total,
                "special_request": item.special_request
            })
            
        # Taxes: 2.5% CGST + 2.5% SGST = 5.0% total GST
        cgst = round(subtotal * settings.TAX_RATE_CGST, 2)
        sgst = round(subtotal * settings.TAX_RATE_SGST, 2)
        total_tax = round(cgst + sgst, 2)
        
        packaging_fee = 0.0
        delivery_fee = 0.0
        if cart.dining_channel == DiningChannelEnum.TAKEAWAY:
            packaging_fee = settings.PACKAGING_CHARGE_TAKEAWAY
        elif cart.dining_channel == DiningChannelEnum.DELIVERY:
            packaging_fee = settings.PACKAGING_CHARGE_TAKEAWAY
            delivery_fee = settings.DELIVERY_FEE_FLAT
            
        discount_amount = 0.0
        final_amount = round(subtotal + total_tax + packaging_fee + delivery_fee - discount_amount, 2)
        
        return {
            "session_id": cart.session_id,
            "outlet_id": cart.outlet_id,
            "outlet_name": outlet_name,
            "table_number": cart.table_number,
            "dining_channel": cart.dining_channel,
            "items": items_detail,
            "item_count": total_items_count,
            "subtotal": round(subtotal, 2),
            "cgst": cgst,
            "sgst": sgst,
            "total_tax": total_tax,
            "packaging_fee": packaging_fee,
            "delivery_fee": delivery_fee,
            "discount_amount": discount_amount,
            "final_amount": final_amount
        }
