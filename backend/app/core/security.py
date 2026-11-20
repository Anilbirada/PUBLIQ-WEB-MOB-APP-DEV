import bcrypt
import hmac
import hashlib
import time
import base64
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt

from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    if plain_password == hashed_password:
        return True
    try:
        pwd_bytes = plain_password[:72].encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password[:72].encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded
    except Exception:
        return None

# --- SECURE QR TOKEN ENCODING & VERIFICATION ---
def generate_secure_qr_token(outlet_id: str, table_id: str, table_number: str) -> str:
    """
    Generates a tamper-proof QR token encoding outlet_id, table_id, and issue timestamp.
    Token structure: base64url(payload) + '.' + signature
    Payload: {"oid": outlet_id, "tid": table_id, "tnum": table_number, "iat": int(now), "nonce": secrets.token_hex(4)}
    """
    payload = {
        "oid": outlet_id,
        "tid": table_id,
        "tnum": table_number,
        "iat": int(time.time()),
        "nonce": secrets.token_hex(4)
    }
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
    
    # Compute HMAC-SHA256 signature
    sig = hmac.new(
        settings.QR_TOKEN_SALT.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
    
    return f"{payload_b64}.{sig_b64}"

def verify_and_decode_qr_token(token: str, max_age_hours: Optional[int] = None) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Verifies that the QR token signature is authentic and hasn't been tampered with.
    Returns: (is_valid, payload, error_message)
    """
    if not token or "." not in token:
        return False, None, "Invalid token format"
    
    parts = token.split(".")
    if len(parts) != 2:
        return False, None, "Malformed token structure"
    
    payload_b64, sig_b64 = parts
    
    # Recompute signature
    expected_sig = hmac.new(
        settings.QR_TOKEN_SALT.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()
    expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode('utf-8').rstrip('=')
    
    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        return False, None, "Cryptographic signature mismatch — QR token may be forged or tampered"
    
    try:
        # Add padding back if necessary
        padded_b64 = payload_b64 + '=' * (-len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode(padded_b64.encode('utf-8')).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Optional expiry check (if configured)
        if max_age_hours:
            iat = payload.get("iat", 0)
            if time.time() - iat > max_age_hours * 3600:
                return False, payload, "QR token expired. Please re-scan the active table code."
                
        return True, payload, "Valid QR token"
    except Exception as e:
        return False, None, f"Failed to parse QR token payload: {str(e)}"
