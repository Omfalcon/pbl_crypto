"""
History Service.
Manages database operations for security activity logging and history retrieval.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.activity_log import ActivityLogModel
from app.models.message import MessageModel


class HistoryService:

    @staticmethod
    def log_event(
        db: Session,
        message_id: str,
        event_type: str,
        event_status: str,
        description: str
    ) -> ActivityLogModel:
        """
        Record a security activity event.
        Never logs plaintext or key material.
        """
        log_entry = ActivityLogModel(
            message_id=message_id,
            event_type=event_type,
            event_status=event_status,
            description=description
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def get_messages(
        db: Session,
        status_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[MessageModel]:
        """
        Retrieve messages based on optional status filters:
        all, encrypted, decrypted, failed_decryption, tampered.
        """
        query = db.query(MessageModel)

        if status_filter:
            status_lower = status_filter.lower().strip()
            if status_lower == "encrypted":
                query = query.filter(MessageModel.encryption_status == "SUCCESS")
            elif status_lower == "decrypted":
                query = query.filter(MessageModel.decryption_status == "SUCCESS")
            elif status_lower == "failed_decryption":
                query = query.filter(MessageModel.decryption_status == "FAILED")
            elif status_lower == "tampered":
                # Find message_ids that have tampering activity logs
                tampered_subquery = (
                    db.query(ActivityLogModel.message_id)
                    .filter(ActivityLogModel.event_type.ilike("%TAMPER%"))
                    .distinct()
                )
                query = query.filter(MessageModel.message_id.in_(tampered_subquery))

        return query.order_by(desc(MessageModel.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def get_message_events(db: Session, message_id: str) -> List[ActivityLogModel]:
        """Get all chronological activity logs associated with a specific message ID."""
        return (
            db.query(ActivityLogModel)
            .filter(ActivityLogModel.message_id == message_id)
            .order_by(ActivityLogModel.created_at.asc())
            .all()
        )
