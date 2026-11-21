"""
Communication History and Security Activity API endpoints.
Provides historical records of encrypted messages and audit events.
Never returns plaintext or cryptographic keys.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.history_service import HistoryService
from app.models.message import MessageModel
from app.schemas.message import InboxMessageItem, ActivityLogItem, MessageDetailResponse

router = APIRouter(prefix="/history", tags=["Communication History"])


@router.get("", response_model=List[InboxMessageItem], status_code=status.HTTP_200_OK)
def get_history(
    filter: Optional[str] = Query(None, description="Filter: all, encrypted, decrypted, failed_decryption, tampered"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve communication metadata history with optional status filtering.
    Plaintext and keys are omitted by design.
    """
    messages = HistoryService.get_messages(
        db=db,
        status_filter=filter,
        skip=skip,
        limit=limit
    )
    return messages


@router.get("/{message_id}/events", response_model=List[ActivityLogItem], status_code=status.HTTP_200_OK)
def get_message_events(message_id: str, db: Session = Depends(get_db)):
    """
    Retrieve security audit events associated with a specific message.
    """
    events = HistoryService.get_message_events(db=db, message_id=message_id)
    return events


@router.get("/{message_id}", response_model=MessageDetailResponse, status_code=status.HTTP_200_OK)
def get_message_details(message_id: str, db: Session = Depends(get_db)):
    """
    Retrieve full metadata and security audit log for a single message.
    """
    message = db.query(MessageModel).filter(MessageModel.message_id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with id '{message_id}' not found."
        )

    events = HistoryService.get_message_events(db=db, message_id=message_id)
    return MessageDetailResponse(message=message, events=events)
