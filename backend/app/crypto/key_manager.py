"""
Cryptographic Key Management Module.
Implements secure generation, validation, and encoding of AES-256 keys.
Never persists keys to disk or database.
"""
import base64
import os
from typing import Dict, Any
from app.core.security import validate_key_bytes


class KeyManager:
    """Manages generation and validation of 256-bit AES cryptographic keys."""

    @staticmethod
    def generate_key() -> Dict[str, Any]:
        """
        Generate a cryptographically secure 256-bit (32 bytes) random key.
        Returns metadata and Base64 representation.
        """
        # Cryptographically secure random 32 bytes
        raw_key = os.urandom(32)
        key_b64 = base64.b64encode(raw_key).decode("utf-8")

        return {
            "key": key_b64,
            "algorithm": "AES-256-GCM",
            "key_size": 256,
            "encoding": "Base64",
            "status": "valid",
            "message": "Cryptographically secure 256-bit AES key generated successfully."
        }

    @staticmethod
    def validate_key(key_b64: str) -> Dict[str, Any]:
        """
        Validates the format and bit length of a supplied AES key.
        NEVER returns the secret key in the response.
        """
        is_valid, message, decoded = validate_key_bytes(key_b64)
        return {
            "valid": is_valid,
            "algorithm": "AES-256-GCM",
            "key_size": 256 if is_valid else (len(decoded) * 8 if decoded else 0),
            "message": message
        }
