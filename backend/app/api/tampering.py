"""
Tampering simulation and integrity verification API endpoints.
Demonstrates:
- Ciphertext modification (confidentiality vs integrity)
- Tag modification (authentication failure)
- Nonce modification (payload corruption)
- Verifications using real AES-GCM engine.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crypto.aes_gcm import AESGCMCryptoEngine
from app.services.history_service import HistoryService
from app.schemas.encryption import TamperRequest, TamperResponse, VerifyRequest, VerifyResponse

router = APIRouter(tags=["Attacker Simulation"])


@router.post("/tamper", response_model=TamperResponse, status_code=status.HTTP_200_OK)
def tamper_payload(payload: TamperRequest, db: Session = Depends(get_db)):
    """
    Simulate attacker intercepting and modifying payload components.
    Modifications are performed strictly on a copy.
    """
    try:
        result = AESGCMCryptoEngine.tamper_payload(
            ciphertext_b64=payload.ciphertext,
            nonce_b64=payload.nonce,
            tag_b64=payload.auth_tag,
            attack_type=payload.attack_type
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to simulate payload tampering."
        )

    # Log security attack event if message_id is available
    if payload.message_id:
        HistoryService.log_event(
            db=db,
            message_id=payload.message_id,
            event_type=f"TAMPER_{payload.attack_type.upper()}",
            event_status="ALERT",
            description=f"Attacker tampered with payload copy: {result['description']}"
        )

    return TamperResponse(
        attack_type=result["attack_type"],
        description=result["description"],
        original_payload=result["original_payload"],
        modified_payload=result["modified_payload"],
        message_id=payload.message_id
    )


@router.post("/verify", response_model=VerifyResponse, status_code=status.HTTP_200_OK)
def verify_payload(payload: VerifyRequest, db: Session = Depends(get_db)):
    """
    Attempt authenticated decryption to verify payload integrity and authenticity.
    Uses the genuine AES-256-GCM authentication verification mechanism.
    """
    success, _, reason = AESGCMCryptoEngine.decrypt(
        ciphertext_b64=payload.ciphertext,
        nonce_b64=payload.nonce,
        tag_b64=payload.auth_tag,
        key_b64=payload.key
    )

    if payload.message_id:
        HistoryService.log_event(
            db=db,
            message_id=payload.message_id,
            event_type="INTEGRITY_VERIFICATION",
            event_status="SUCCESS" if success else "FAILURE",
            description=f"Integrity check {'passed' if success else 'failed'}: {reason}"
        )

    return VerifyResponse(
        verification_status="VERIFIED" if success else "FAILED",
        decryption_status="SUCCESS" if success else "FAILED",
        authenticated=success,
        reason=reason
    )
