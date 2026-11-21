"""
SQLAlchemy Model for Encrypted Messages.
Only stores non-sensitive communication metadata and encrypted payload.
Never contains plaintext or secret key columns.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(String(64), unique=True, index=True, nullable=False)
    sender = Column(String(50), nullable=False, default="Alice")
    receiver = Column(String(50), nullable=False, default="Bob")
    algorithm = Column(String(50), nullable=False, default="AES-256-GCM")

    # Encrypted payload fields (safe for storage)
    ciphertext = Column(Text, nullable=False)
    nonce = Column(String(64), nullable=False)
    auth_tag = Column(String(64), nullable=False)

    # Operational and security status
    encryption_status = Column(String(30), nullable=False, default="SUCCESS")
    decryption_status = Column(String(30), nullable=False, default="PENDING")
    authentication_status = Column(String(30), nullable=False, default="PENDING")

    # Timestamps (stored in UTC)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    decrypted_at = Column(DateTime, nullable=True)
