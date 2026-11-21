"""
Message Service.
Handles message encryption persistence, transfer to Bob, and inbox tracking.
Never stores plaintext or secret keys.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.message import MessageModel
from app.services.history_service import HistoryService


class MessageService:

    @staticmethod
    def save_encrypted_message(
        db: Session,
        ciphertext: str,
        nonce: str,
        auth_tag: str,
        sender: str = "Alice",
        receiver: str = "Bob",
        algorithm: str = "AES-256-GCM"
    ) -> MessageModel:
        """Create message record with encrypted payload and log encryption event."""
        msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        message = MessageModel(
            message_id=msg_id,
            sender=sender,
            receiver=receiver,
            algorithm=algorithm,
            ciphertext=ciphertext,
            nonce=nonce,
            auth_tag=auth_tag,
            encryption_status="SUCCESS",
            decryption_status="PENDING",
            authentication_status="PENDING"
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        # Log event
        HistoryService.log_event(
            db=db,
            message_id=msg_id,
            event_type="MESSAGE_ENCRYPTED",
            event_status="SUCCESS",
            description=f"Message encrypted with {algorithm} (Nonce: {nonce[:8]}..., Tag: {auth_tag[:8]}...)."
        )

        return message

    @staticmethod
    def transfer_message_to_bob(
        db: Session,
        message_id: str,
        ciphertext: str,
        nonce: str,
        auth_tag: str,
        sender: str = "Alice",
        receiver: str = "Bob"
    ) -> MessageModel:
        """Transfer message to Bob's inbox or mark existing message as transferred."""
        message = db.query(MessageModel).filter(MessageModel.message_id == message_id).first()
        if not message:
            message = MessageModel(
                message_id=message_id,
                sender=sender,
                receiver=receiver,
                algorithm="AES-256-GCM",
                ciphertext=ciphertext,
                nonce=nonce,
                auth_tag=auth_tag,
                encryption_status="SUCCESS",
                decryption_status="PENDING",
                authentication_status="PENDING"
            )
            db.add(message)
            db.commit()
            db.refresh(message)

        # Log transfer event
        HistoryService.log_event(
            db=db,
            message_id=message_id,
            event_type="MESSAGE_TRANSFERRED",
            event_status="SUCCESS",
            description=f"Encrypted payload transferred from {sender} to {receiver} without exposing plaintext."
        )

        return message

    @staticmethod
    def get_inbox_messages(db: Session, receiver: str = "Bob") -> List[MessageModel]:
        """Fetch all incoming messages addressed to receiver."""
        return (
            db.query(MessageModel)
            .filter(MessageModel.receiver == receiver)
            .order_by(desc(MessageModel.created_at))
            .all()
        )

    @staticmethod
    def record_decryption_attempt(
        db: Session,
        message_id: Optional[str],
        success: bool,
        detail_msg: str
    ):
        """Record decryption outcome and update message status if message_id exists."""
        if not message_id:
            return

        message = db.query(MessageModel).filter(MessageModel.message_id == message_id).first()
        if message:
            if success:
                message.decryption_status = "SUCCESS"
                message.authentication_status = "VERIFIED"
                message.decrypted_at = datetime.now(timezone.utc)
            else:
                message.decryption_status = "FAILED"
                message.authentication_status = "FAILED"
            db.commit()

        HistoryService.log_event(
            db=db,
            message_id=message_id,
            event_type="DECRYPTION_ATTEMPT",
            event_status="SUCCESS" if success else "FAILURE",
            description=detail_msg
        )
