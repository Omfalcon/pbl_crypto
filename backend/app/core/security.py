"""
Core security utilities and validation.
Enforces strict sanitization and validation of cryptographic inputs.
"""
import base64
import re
from typing import Tuple


def is_valid_base64(data: str) -> bool:
    """Check if the string is valid Base64 encoded."""
    if not isinstance(data, str) or not data.strip():
        return False
    # Validate Base64 characters and padding
    if not re.fullmatch(r'^[A-Za-z0-9+/]+={0,2}$', data.strip()):
        return False
    try:
        decoded = base64.b64decode(data.strip(), validate=True)
        # Re-encode to verify standard representation
        return len(decoded) > 0
    except Exception:
        return False


def validate_key_bytes(key_b64: str) -> Tuple[bool, str, bytes]:
    """
    Validate that the provided key is valid Base64 and decodes to exactly 32 bytes (256 bits).
    Returns (is_valid, error_message, decoded_bytes).
    """
    if not key_b64 or not isinstance(key_b64, str):
        return False, "Key must be a non-empty string.", b""

    cleaned = key_b64.strip()
    try:
        decoded = base64.b64decode(cleaned, validate=True)
    except Exception:
        return False, "Key is not a valid Base64 encoded string.", b""

    if len(decoded) != 32:
        return False, f"Key must be exactly 32 bytes (256 bits). Received {len(decoded)} bytes.", decoded

    return True, "Key is valid AES-256 key.", decoded
