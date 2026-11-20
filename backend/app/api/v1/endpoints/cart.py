from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models import Cart, CartItem, DiningChannelEnum
from app.schemas import (
    CartDetailResponse, CartItemAddRequest, CartItemUpdateRequest
)
from app.services.cart_service import CartService

router = APIRouter()

@router.get("/{session_id}", response_model=CartDetailResponse)
def get_cart(session_id: str, db: Session = Depends(get_db)):
    calc = CartService.calculate_cart_details(db, session_id)
    return CartDetailResponse(**calc)

@router.post("/{session_id}/init")
def initialize_cart(
    session_id: str,
    outlet_id: str = Body(..., embed=True),
    dining_channel: DiningChannelEnum = Body(DiningChannelEnum.DINE_IN, embed=True),
    table_number: Optional[str] = Body(None, embed=True),
    qr_session_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    cart = CartService.get_or_create_cart(
        db, session_id, outlet_id, dining_channel, table_number, qr_session_id
    )
    return CartService.calculate_cart_details(db, session_id)

@router.post("/{session_id}/items", response_model=CartDetailResponse)
def add_to_cart(
    session_id: str,
    req: CartItemAddRequest,
    outlet_id: Optional[str] = None,
    table_number: Optional[str] = None,
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.session_id == session_id).first()
    if not cart:
        if not outlet_id:
            # Pick first active outlet if not explicitly set
            from app.models import Outlet
            first_outlet = db.query(Outlet).filter(Outlet.is_active == True).first()
            outlet_id = first_outlet.id if first_outlet else "default-outlet"
        cart = CartService.get_or_create_cart(db, session_id, outlet_id, table_number=table_number)

    try:
        CartService.add_item_to_cart(
            db=db,
            cart_id=cart.id,
            item_id=req.item_id,
            variant_id=req.variant_id,
            quantity=req.quantity,
            selected_addon_ids=req.selected_addon_ids,
            special_request=req.special_request
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return CartService.calculate_cart_details(db, session_id)

@router.put("/{session_id}/items/{cart_item_id}", response_model=CartDetailResponse)
def update_cart_item(
    session_id: str,
    cart_item_id: str,
    req: CartItemUpdateRequest,
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.session_id == session_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found.")
        
    item = db.query(CartItem).filter(CartItem.id == cart_item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")
        
    if req.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = req.quantity
        if req.special_request is not None:
            item.special_request = req.special_request
            
    db.commit()
    return CartService.calculate_cart_details(db, session_id)

@router.delete("/{session_id}/items/{cart_item_id}", response_model=CartDetailResponse)
def remove_cart_item(
    session_id: str,
    cart_item_id: str,
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.session_id == session_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found.")
        
    item = db.query(CartItem).filter(CartItem.id == cart_item_id, CartItem.cart_id == cart.id).first()
    if item:
        db.delete(item)
        db.commit()
        
    return CartService.calculate_cart_details(db, session_id)

@router.delete("/{session_id}", response_model=CartDetailResponse)
def clear_cart(session_id: str, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.session_id == session_id).first()
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
    return CartService.calculate_cart_details(db, session_id)
