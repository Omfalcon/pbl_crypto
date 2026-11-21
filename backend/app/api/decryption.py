"""
Decryption API endpoint.
Handles AES-256-GCM authenticated decryption.
Verifies authentication tag before releasing plaintext.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crypto.aes_gcm import AESGCMCryptoEngine
from app.services.message_service import MessageService
from app.schemas.encryption import DecryptRequest, DecryptResponse

router = APIRouter(prefix="/decrypt", tags=["Decryption"])


@router.post("", response_model=DecryptResponse, status_code=status.HTTP_200_OK)
def decrypt_message(payload: DecryptRequest, db: Session = Depends(get_db)):
    """
    Perform authenticated AES-256-GCM decryption.
    Strictly verifies the authentication tag before releasing plaintext.
    Never returns unauthenticated data or raw exception stack traces.
    """
    success, plaintext, message = AESGCMCryptoEngine.decrypt(
        ciphertext_b64=payload.ciphertext,
        nonce_b64=payload.nonce,
        tag_b64=payload.auth_tag,
        key_b64=payload.key
    )

    now_iso = datetime.now(timezone.utc).isoformat() if success else None

    # Record decryption attempt in database
    MessageService.record_decryption_attempt(
        db=db,
        message_id=payload.message_id,
        success=success,
        detail_msg=message
    )

    return DecryptResponse(
        success=success,
        decrypted_plaintext=plaintext if success else None,
        authentication_status="VERIFIED" if success else "FAILED",
        decryption_timestamp=now_iso,
        message=message
    )
