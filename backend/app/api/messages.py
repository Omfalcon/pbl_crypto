"""
Message transfer and inbox API endpoints.
Allows transferring encrypted messages to Bob and viewing incoming messages.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.message_service import MessageService
from app.schemas.message import SendMessageRequest, SendMessageResponse, InboxMessageItem

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("/send", response_model=SendMessageResponse, status_code=status.HTTP_200_OK)
def send_message(payload: SendMessageRequest, db: Session = Depends(get_db)):
    """
    Transfer an encrypted payload from Alice to Bob.
    Plaintext and key are never transferred or stored.
    """
    MessageService.transfer_message_to_bob(
        db=db,
        message_id=payload.message_id,
        ciphertext=payload.ciphertext,
        nonce=payload.nonce,
        auth_tag=payload.auth_tag,
        sender=payload.sender,
        receiver=payload.receiver
    )

    return SendMessageResponse(
        transfer_status="SUCCESS",
        message_id=payload.message_id,
        receiver=payload.receiver,
        message=f"Encrypted message payload transferred to {payload.receiver}'s inbox successfully."
    )


@router.get("/inbox", response_model=List[InboxMessageItem], status_code=status.HTTP_200_OK)
def get_inbox(receiver: str = "Bob", db: Session = Depends(get_db)):
    """
    Fetch pending and received encrypted messages for Bob.
    Never exposes plaintext or secret keys.
    """
    messages = MessageService.get_inbox_messages(db=db, receiver=receiver)
    return messages
