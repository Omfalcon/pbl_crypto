"""
Pydantic schemas for message lifecycle and communication history.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SendMessageRequest(BaseModel):
    message_id: str
    ciphertext: str
    nonce: str
    auth_tag: str
    sender: str = "Alice"
    receiver: str = "Bob"
    algorithm: str = "AES-256-GCM"


class SendMessageResponse(BaseModel):
    transfer_status: str
    message_id: str
    receiver: str
    message: str


class InboxMessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message_id: str
    sender: str
    receiver: str
    algorithm: str
    ciphertext: str
    nonce: str
    auth_tag: str
    encryption_status: str
    decryption_status: str
    authentication_status: str
    created_at: datetime
    decrypted_at: Optional[datetime] = None


class ActivityLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message_id: str
    event_type: str
    event_status: str
    description: str
    created_at: datetime


class MessageDetailResponse(BaseModel):
    message: InboxMessageItem
    events: List[ActivityLogItem]
