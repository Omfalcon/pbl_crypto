"""
Pydantic schemas for encryption, decryption, and tampering operations.
"""
from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, Field


class EncryptRequest(BaseModel):
    plaintext: str = Field(..., min_length=1, max_length=10000, description="Plaintext message up to 10,000 characters")
    key: str = Field(..., description="Base64 encoded 256-bit AES key")
    sender: str = Field(default="Alice")
    receiver: str = Field(default="Bob")


class EncryptResponse(BaseModel):
    message_id: str
    ciphertext: str
    nonce: str
    auth_tag: str
    algorithm: str = "AES-256-GCM"
    encryption_timestamp: str
    encryption_status: str = "SUCCESS"


class DecryptRequest(BaseModel):
    message_id: Optional[str] = None
    ciphertext: str
    nonce: str
    auth_tag: str
    key: str


class DecryptResponse(BaseModel):
    success: bool
    decrypted_plaintext: Optional[str] = None
    authentication_status: str
    decryption_timestamp: Optional[str] = None
    message: str


class TamperRequest(BaseModel):
    message_id: Optional[str] = None
    ciphertext: str
    nonce: str
    auth_tag: str
    attack_type: str = Field(..., description="'ciphertext', 'tag', or 'nonce'")


class TamperResponse(BaseModel):
    attack_type: str
    description: str
    original_payload: Dict[str, str]
    modified_payload: Dict[str, str]
    message_id: Optional[str] = None


class VerifyRequest(BaseModel):
    message_id: Optional[str] = None
    ciphertext: str
    nonce: str
    auth_tag: str
    key: str


class VerifyResponse(BaseModel):
    verification_status: str
    decryption_status: str
    authenticated: bool
    reason: str
