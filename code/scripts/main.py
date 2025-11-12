from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import sys
import os

# Add the scripts directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.rag_service import RAGService
from app.auth import router as auth_router

app = FastAPI(title="Ερμής - Greek Army RAG API")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service
cfg_path = os.getenv("CONFIG_PATH", "scripts/config.yml")
rag_service = None

try:
    rag_service = RAGService(cfg_path)
    print(f"✓ RAG Service initialized with config: {cfg_path}")
except Exception as e:
    print(f"⚠ Warning: Could not initialize RAG service: {e}")
    print("  The API will run in demo mode.")

app.include_router(auth_router)

@app.get("/")
async def root():
    return {
        "service": "Ερμής - Greek Army RAG System",
        "status": "online" if rag_service else "demo_mode",
        "endpoints": ["/query", "/ws/chat", "/upload", "/health"]
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "rag_initialized": rag_service is not None
    }


@app.post("/query")
async def query(data: dict):
    """Non-streaming query endpoint."""
    question = data.get("question", "")
    
    if not question:
        return JSONResponse(
            {"error": "No question provided"},
            status_code=400
        )
    
    if not rag_service:
        return JSONResponse({
            "answer": "Το σύστημα RAG δεν είναι διαθέσιμο. Παρακαλώ ρυθμίστε το Weaviate και το Ollama.",
            "sources": [],
            "demo_mode": True
        })
    
    try:
        answer, context, scores, metas = rag_service.answer(question)
        
        sources = []
        for text, score, meta in zip(context, scores, metas):
            sources.append({
                "text": text[:200] + "..." if len(text) > 200 else text,
                "score": score,
                "source": meta.get("source", "Άγνωστη πηγή")
            })
        
        return {
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        return JSONResponse(
            {"error": f"Query failed: {str(e)}"},
            status_code=500
        )


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for streaming chat responses."""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("question", "")
            
            if not question:
                await websocket.send_json({"error": "No question provided"})
                continue
            
            if not rag_service:
                await websocket.send_json({
                    "type": "error",
                    "content": "Το σύστημα RAG δεν είναι διαθέσιμο."
                })
                continue
            
            # Send sources first
            ctx_texts, scores, metas = rag_service.retrieve(question)
            sources = []
            for text, score, meta in zip(ctx_texts, scores, metas):
                sources.append({
                    "text": text[:200] + "..." if len(text) > 200 else text,
                    "score": score,
                    "source": meta.get("source", "Άγνωστη πηγή")
                })
            
            await websocket.send_json({
                "type": "sources",
                "sources": sources
            })
            
            # Stream the answer
            for token in rag_service.stream_answer(question):
                await websocket.send_json({
                    "type": "token",
                    "content": token
                })
            
            await websocket.send_json({
                "type": "done"
            })
            
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": str(e)
            })
        except:
            pass


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document to the corpus."""
    if not rag_service:
        return JSONResponse(
            {"error": "RAG service not initialized"},
            status_code=503
        )
    
    try:
        # Save uploaded file
        corpus_dir = Path("scripts/data/corpus")
        corpus_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = corpus_dir / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return {
            "status": "success",
            "message": f"File {file.filename} uploaded successfully",
            "note": "Run ingestion script to index the document"
        }
    except Exception as e:
        return JSONResponse(
            {"error": f"Upload failed: {str(e)}"},
            status_code=500
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
