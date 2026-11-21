from app.api.keys import router as keys_router
from app.api.encryption import router as encryption_router
from app.api.decryption import router as decryption_router
from app.api.messages import router as messages_router
from app.api.tampering import router as tampering_router
from app.api.history import router as history_router

__all__ = [
    "keys_router",
    "encryption_router",
    "decryption_router",
    "messages_router",
    "tampering_router",
    "history_router",
]
