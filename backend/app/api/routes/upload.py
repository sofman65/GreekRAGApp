"""
Document upload routes
"""

from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), request: Request = None):
    """Upload a document to the corpus"""
    
    rag_service = request.app.state.rag_service if request else None
    
    if not rag_service:
        return JSONResponse(
            {"error": "RAG service not initialized"},
            status_code=503
        )
    
    try:
        # Save uploaded file to corpus directory
        corpus_dir = Path("backend/data/corpus")
        corpus_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = corpus_dir / file.filename
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"File uploaded: {file.filename}")
        
        return {
            "status": "success",
            "message": f"File {file.filename} uploaded successfully",
            "note": "Run ingestion script to index the document",
            "path": str(file_path)
        }
        
    except Exception as e:
        logger.error(f"Upload failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )

