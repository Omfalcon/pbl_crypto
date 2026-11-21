"""
Key Management API endpoints.
Provides secure 256-bit AES key generation and validation.
Never stores keys in the database or server state.
"""
from fastapi import APIRouter, HTTPException, status
from app.crypto.key_manager import KeyManager
from app.schemas.key import KeyGenerateResponse, KeyValidateRequest, KeyValidateResponse

router = APIRouter(prefix="/keys", tags=["Key Management"])


@router.post("/generate", response_model=KeyGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_key():
    """
    Generate a cryptographically secure random 256-bit AES key.
    The key is returned in Base64 encoding. It is NEVER persisted in SQLite.
    """
    return KeyManager.generate_key()


@router.post("/validate", response_model=KeyValidateResponse, status_code=status.HTTP_200_OK)
def validate_key(payload: KeyValidateRequest):
    """
    Validate an existing Base64 encoded AES key.
    Checks for valid Base64 encoding and exactly 32 decoded bytes (256 bits).
    Never exposes or reflects the key in the response.
    """
    result = KeyManager.validate_key(payload.key)
    return result
