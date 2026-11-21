"""
Pydantic schemas for cryptographic key operations.
"""
from pydantic import BaseModel, Field


class KeyGenerateResponse(BaseModel):
    key: str = Field(..., description="Base64 encoded 256-bit AES key")
    algorithm: str = Field(default="AES-256-GCM")
    key_size: int = Field(default=256)
    encoding: str = Field(default="Base64")
    status: str = Field(default="valid")
    message: str


class KeyValidateRequest(BaseModel):
    key: str = Field(..., description="Base64 encoded key to validate")


class KeyValidateResponse(BaseModel):
    valid: bool
    algorithm: str = Field(default="AES-256-GCM")
    key_size: int
    message: str
