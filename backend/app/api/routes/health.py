"""
Health check and status routes
"""

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    """Health check endpoint"""
    rag_service = request.app.state.rag_service
    
    return {
        "status": "healthy",
        "rag_initialized": rag_service is not None
    }


@router.get("/status")
async def status(request: Request):
    """Detailed status information"""
    rag_service = request.app.state.rag_service
    
    return {
        "service": "Ερμής RAG API",
        "status": "online" if rag_service else "demo_mode",
        "rag_service": {
            "initialized": rag_service is not None,
            "ready": rag_service is not None
        }
    }

