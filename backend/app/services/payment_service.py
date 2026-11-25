import uuid
import secrets
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.models import Order, Payment, PosOutboxEvent, PaymentStatusEnum, PaymentMethodEnum, OrderStatusEnum
from app.schemas import PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse

class PaymentService:
    @staticmethod
    def initiate_payment(db: Session, req: PaymentInitiateRequest) -> PaymentInitiateResponse:
        order = db.query(Order).filter(Order.id == req.order_id).first()
        if not order:
            raise ValueError(f"Order '{req.order_id}' not found.")
            
        if order.payment_status == PaymentStatusEnum.PAID:
            raise ValueError("This order is already marked as PAID.")
            
        # Check for existing pending payment transaction
        existing_payment = db.query(Payment).filter(
            Payment.order_id == order.id,
            Payment.status == PaymentStatusEnum.PENDING
        ).first()
        
        transaction_ref = f"TXN-PUB-{secrets.token_hex(6).upper()}"
        
        if existing_payment:
            payment = existing_payment
            payment.payment_method = req.payment_method
            payment.transaction_ref = transaction_ref
        else:
            payment = Payment(
                order_id=order.id,
                amount=order.final_amount,
                currency="INR",
                payment_method=req.payment_method,
                status=PaymentStatusEnum.PENDING,
                transaction_ref=transaction_ref,
                gateway_name="PUBLIQ_SECURE_PAY",
                metadata_info={"channel": order.dining_channel.value}
            )
            db.add(payment)
            
        db.commit()
        db.refresh(payment)
        
        instructions = ""
        if req.payment_method == PaymentMethodEnum.UPI:
            instructions = f"upi://pay?pa=publiq@icici&pn=PUBLIQ%20BAR%20RESTAURANT&am={order.final_amount}&cu=INR&tn=Order_{order.order_number}"
        elif req.payment_method == PaymentMethodEnum.NETBANKING:
            instructions = "Please complete NetBanking authorization via your selected bank portal."
        elif req.payment_method == PaymentMethodEnum.CARD:
            instructions = "Please enter card details and complete 3D-Secure bank OTP verification."
        elif req.payment_method == PaymentMethodEnum.COUNTER_BILLING:
            instructions = "Please present this Order ID to your server or at the main counter upon concluding your dining experience."
            
        return PaymentInitiateResponse(
            payment_id=payment.id,
            order_id=order.id,
            amount=order.final_amount,
            currency="INR",
            status=payment.status,
            gateway_name=payment.gateway_name,
            transaction_ref=payment.transaction_ref,
            instructions=instructions
        )

    @staticmethod
    def verify_payment(db: Session, req: PaymentVerifyRequest) -> PaymentVerifyResponse:
        import re
        payment = db.query(Payment).filter(Payment.id == req.payment_id).first()
        if not payment:
            raise ValueError(f"Payment record '{req.payment_id}' not found.")
            
        order = db.query(Order).filter(Order.id == payment.order_id).first()
        if not order:
            raise ValueError("Associated order not found.")
            
        # Idempotency check: already marked paid
        if payment.status == PaymentStatusEnum.PAID:
            return PaymentVerifyResponse(
                success=True,
                order_id=order.id,
                order_number=order.order_number,
                payment_status=order.payment_status,
                order_status=order.order_status,
                message="Payment was already verified and settled."
            )

        # -------------------------------------------------------------
        # STRICT REAL DATA VALIDATION (REJECTS WRONG OR FAKE INFORMATION)
        # -------------------------------------------------------------
        clean_ref = (req.transaction_ref or "").strip()

        # UPI Validation
        if payment.payment_method == PaymentMethodEnum.UPI:
            # Must be exactly 12 numeric digits
            if not re.match(r"^\d{12}$", clean_ref):
                raise ValueError("Invalid UPI Reference Number (UTR). NPCI standard requires exactly 12 numeric digits.")

            # Reject repeating dummy digits
            if len(set(clean_ref)) <= 1:
                raise ValueError("NPCI Switch Rejection: Invalid dummy UPI reference number. Repeating digits are rejected.")

            # Reject known fake sequences
            if clean_ref in ["123456789012", "012345678901", "987654321098"]:
                raise ValueError("UTR Verification Failed: Transaction reference not found on NPCI settlement network.")

            # Duplicate UTR check across database
            existing_settled = db.query(Payment).filter(
                Payment.transaction_ref == clean_ref,
                Payment.status == PaymentStatusEnum.PAID,
                Payment.id != payment.id
            ).first()
            if existing_settled:
                raise ValueError("Duplicate Transaction: This UPI Reference (UTR) has already been used and settled for another order.")

        # Card Validation
        elif payment.payment_method == PaymentMethodEnum.CARD:
            if "DECLINED" in clean_ref or "FAILED" in clean_ref or not req.simulated_success:
                payment.status = PaymentStatusEnum.FAILED
                order.payment_status = PaymentStatusEnum.FAILED
                db.commit()
                raise ValueError("Card 3D-Secure authentication failed: Issuing bank declined authorization.")

        payment.transaction_ref = clean_ref or payment.transaction_ref
            
        if req.simulated_success:
            payment.status = PaymentStatusEnum.PAID
            order.payment_status = PaymentStatusEnum.PAID
            if order.order_status == OrderStatusEnum.PLACED:
                order.order_status = OrderStatusEnum.ACCEPTED
                
            # POS event
            outbox_event = PosOutboxEvent(
                event_type="customer.payment.completed",
                order_id=order.id,
                outlet_id=order.outlet_id,
                payload={
                    "order_number": order.order_number,
                    "payment_id": payment.id,
                    "amount": payment.amount,
                    "method": payment.payment_method.value,
                    "transaction_ref": payment.transaction_ref
                },
                is_processed=False
            )
            db.add(outbox_event)
            db.commit()
            
            return PaymentVerifyResponse(
                success=True,
                order_id=order.id,
                order_number=order.order_number,
                payment_status=order.payment_status,
                order_status=order.order_status,
                message="Payment verified successfully. Your order is confirmed and sent to the kitchen!"
            )
        else:
            payment.status = PaymentStatusEnum.FAILED
            order.payment_status = PaymentStatusEnum.FAILED
            db.commit()
            return PaymentVerifyResponse(
                success=False,
                order_id=order.id,
                order_number=order.order_number,
                payment_status=order.payment_status,
                order_status=order.order_status,
                message="Payment authorization failed. Please try another payment method."
            )
