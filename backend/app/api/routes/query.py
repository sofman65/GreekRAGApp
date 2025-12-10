"""
Query routes for RAG system interactions
"""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import logging

from app.schemas.query import QueryRequest, QueryResponse, SourceInfo

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest, req: Request):
    """Non-streaming query endpoint for RAG system"""

    orchestrator = getattr(req.app.state, "query_orchestrator", None)

    if not request.question:
        return JSONResponse(
            {"error": "No question provided"},
            status_code=400
        )

    # Demo mode if orchestrator not available
    if not orchestrator:
        return QueryResponse(
            answer="Το σύστημα RAG δεν είναι διαθέσιμο. Παρακαλώ ρυθμίστε το Weaviate και το Ollama.",
            sources=[],
            demo_mode=True,
            mode="demo",
            label="DEMO",
        )

    try:
        outcome = orchestrator.answer_question(request.question)

        sources = []
        for text, score, meta in zip(outcome.ctx_texts, outcome.scores, outcome.metas):
            sources.append(
                SourceInfo(
                    text=text[:200] + "..." if len(text) > 200 else text,
                    score=score,
                    source=meta.get("source", "Άγνωστη πηγή"),
                )
            )

        return QueryResponse(
            answer=outcome.answer,
            sources=sources,
            demo_mode=False,
            mode=outcome.mode,
            label=outcome.label,
        )

    except Exception as e:
        logger.error(f"Query failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}"
        )


@router.post("/stream")
async def stream_query(request: QueryRequest, req: Request):
    """SSE streaming endpoint for RAG system"""

    orchestrator = getattr(req.app.state, "query_orchestrator", None)

    if not request.question:
        return JSONResponse({"error": "No question provided"}, status_code=400)

    if not orchestrator:
        return JSONResponse(
            {"error": "RAG system not available"},
            status_code=503
        )

    async def generate():
        try:
            plan = orchestrator.plan_question(request.question)

            # Send sources
            sources = []
            for text, score, meta in zip(plan.ctx_texts, plan.scores, plan.metas):
                sources.append({
                    "text": text[:200] + "..." if len(text) > 200 else text,
                    "score": score,
                    "source": meta.get("source", "Άγνωστη πηγή")
                })

            yield f"event: sources\ndata: {json.dumps(sources)}\n\n"

            # Stream tokens (works for both RAG and chat now)
            for token in orchestrator.stream_plan(plan):
                yield f"data: {token}\n\n"

            # Send done event
            yield f"event: done\ndata: {json.dumps({'mode': plan.mode, 'label': plan.label})}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for streaming chat responses"""
    await websocket.accept()

    try:
        orchestrator = getattr(websocket.app.state, "query_orchestrator", None)

        while True:
            data = await websocket.receive_json()
            question = data.get("question", "")

            if not question:
                await websocket.send_json({"error": "No question provided"})
                continue

            if not orchestrator:
                await websocket.send_json({
                    "type": "error",
                    "content": "Το σύστημα RAG δεν είναι διαθέσιμο."
                })
                continue

            try:
                plan = orchestrator.plan_question(question)

                if plan.mode != "rag":
                    outcome = orchestrator.fulfill_plan(plan)
                    await websocket.send_json({
                        "type": "sources",
                        "sources": [],
                        "mode": outcome.mode,
                        "label": outcome.label,
                    })
                    await websocket.send_json({
                        "type": "token",
                        "content": outcome.answer,
                        "mode": outcome.mode,
                        "label": outcome.label,
                    })
                    await websocket.send_json({"type": "done", "mode": outcome.mode})
                    continue

                sources = []
                for text, score, meta in zip(plan.ctx_texts, plan.scores, plan.metas):
                    sources.append({
                        "text": text[:200] + "..." if len(text) > 200 else text,
                        "score": score,
                        "source": meta.get("source", "Άγνωστη πηγή")
                    })

                await websocket.send_json({
                    "type": "sources",
                    "sources": sources,
                    "mode": plan.mode,
                    "label": plan.label,
                })

                for token in orchestrator.stream_plan(plan):
                    await websocket.send_json({
                        "type": "token",
                        "content": token,
                        "mode": plan.mode,
                        "label": plan.label,
                    })

                await websocket.send_json({
                    "type": "done",
                    "mode": plan.mode,
                    "label": plan.label,
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
