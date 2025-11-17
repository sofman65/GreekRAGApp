"""
FastAPI main application entry point for Ερμής RAG System
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import os
import logging

from app.core.config import settings
from app.core.middleware import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware
)
from app.api.routes import auth, query, health, upload
from app.services.rag_service import RAGService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Greek Army RAG System for Military Regulations and Documents",
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Security middleware - order matters!
# Add security headers
app.add_middleware(SecurityHeadersMiddleware)

# Add request logging
app.add_middleware(RequestLoggingMiddleware)

# Add rate limiting (adjust limits for production)
if not settings.DEBUG:
    app.add_middleware(RateLimitMiddleware, calls=100, period=60)

# Add trusted host protection (production)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.mil.gr"]  # Adjust for your domain
    )

# CORS middleware - should be last
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service
rag_service = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global rag_service
    
    try:
        config_path = os.getenv("CONFIG_PATH", "backend/config/config.yml")
        rag_service = RAGService(config_path)
        logger.info(f"✓ RAG Service initialized with config: {config_path}")
        
        # Store in app state for access in routes
        app.state.rag_service = rag_service
        
    except Exception as e:
        logger.warning(f"⚠ Could not initialize RAG service: {e}")
        logger.warning("  The API will run in demo mode.")
        app.state.rag_service = None


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Ερμής RAG API...")


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(query.router, prefix="/api", tags=["query"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(upload.router, prefix="/api", tags=["upload"])


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online" if app.state.rag_service else "demo_mode",
        "docs": "/api/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
