"""
Encryption API endpoint.
Handles AES-256-GCM authenticated encryption.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crypto.aes_gcm import AESGCMCryptoEngine
from app.services.message_service import MessageService
from app.schemas.encryption import EncryptRequest, EncryptResponse

router = APIRouter(prefix="/encrypt", tags=["Encryption"])


@router.post("", response_model=EncryptResponse, status_code=status.HTTP_200_OK)
def encrypt_message(payload: EncryptRequest, db: Session = Depends(get_db)):
    """
    Encrypt plaintext using AES-256-GCM.
    - Generates a fresh 12-byte random nonce.
    - Produces a 16-byte authentication tag.
    - Stores non-sensitive metadata in the database (never the key or plaintext).
    """
    try:
        crypto_result = AESGCMCryptoEngine.encrypt(
            plaintext=payload.plaintext,
            key_b64=payload.key
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Encryption operation encountered an unexpected error."
        )

    # Persist encrypted payload and metadata to database
    db_message = MessageService.save_encrypted_message(
        db=db,
        ciphertext=crypto_result["ciphertext"],
        nonce=crypto_result["nonce"],
        auth_tag=crypto_result["auth_tag"],
        sender=payload.sender,
        receiver=payload.receiver,
        algorithm="AES-256-GCM"
    )

    return EncryptResponse(
        message_id=db_message.message_id,
        ciphertext=crypto_result["ciphertext"],
        nonce=crypto_result["nonce"],
        auth_tag=crypto_result["auth_tag"],
        algorithm=crypto_result["algorithm"],
        encryption_timestamp=db_message.created_at.isoformat(),
        encryption_status="SUCCESS"
    )
