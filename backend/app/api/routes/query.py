"""
Query routes for RAG system interactions
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import JSONResponse
import logging

from app.models.query import QueryRequest, QueryResponse, SourceInfo

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest, req: Request):
    """Non-streaming query endpoint for RAG system"""
    
    rag_service = req.app.state.rag_service
    
    if not request.question:
        return JSONResponse(
            {"error": "No question provided"},
            status_code=400
        )
    
    # Demo mode if RAG service not available
    if not rag_service:
        return QueryResponse(
            answer="Το σύστημα RAG δεν είναι διαθέσιμο. Παρακαλώ ρυθμίστε το Weaviate και το Ollama.",
            sources=[],
            demo_mode=True
        )
    
    try:
        answer, context, scores, metas = rag_service.answer(request.question)
        
        sources = []
        for text, score, meta in zip(context, scores, metas):
            sources.append(SourceInfo(
                text=text[:200] + "..." if len(text) > 200 else text,
                score=score,
                source=meta.get("source", "Άγνωστη πηγή")
            ))
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            demo_mode=False
        )
        
    except Exception as e:
        logger.error(f"Query failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}"
        )


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for streaming chat responses"""
    await websocket.accept()
    
    try:
        rag_service = websocket.app.state.rag_service
        
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
            
            try:
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
                
            except Exception as e:
                logger.error(f"Error processing question: {e}", exc_info=True)
                await websocket.send_json({
                    "type": "error",
                    "content": str(e)
                })
            
    except WebSocketDisconnect:
        logger.info("Client disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "content": str(e)
            })
        except:
            pass

