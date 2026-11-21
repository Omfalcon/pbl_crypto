"""
Main FastAPI application entry point.
Configures CORS, registers API routers, and initializes SQLite database schema.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine, Base
import app.models  # Ensure models are loaded before creating tables
from app.api import (
    keys_router,
    encryption_router,
    decryption_router,
    messages_router,
    tampering_router,
    history_router,
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Interactive local simulation of AES-256-GCM secure communication (Alice ↔ Bob)."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if not settings.DEBUG else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers with /api prefix
app.include_router(keys_router, prefix="/api")
app.include_router(encryption_router, prefix="/api")
app.include_router(decryption_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(tampering_router, prefix="/api")
app.include_router(history_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "algorithm": "AES-256-GCM",
        "version": settings.VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
