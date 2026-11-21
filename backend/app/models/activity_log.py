"""
SQLAlchemy Model for Security Activity Logs.
Records operational and security audit events for each message or test attempt.
Never logs keys or plaintext.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


class ActivityLogModel(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(String(64), index=True, nullable=False)
    event_type = Column(String(50), nullable=False)
    event_status = Column(String(30), nullable=False)  # SUCCESS, FAILURE, WARNING, ALERT
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
