"""
FastAPI backend server for Ερμής RAG system.
Place this alongside your existing RAG service code.
Run with: uvicorn backend_server:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
from pathlib import Path

# Add your app directory to path if needed
# sys.path.insert(0, str(Path(__file__).parent.parent))

app = FastAPI(title="Ερμής RAG API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service (uncomment when you have the files)
# from app.rag_service import RAGService
# rag_service = RAGService("configs/local_ollama.yml")


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    context: list[str]
    scores: list[float]


@app.get("/")
async def root():
    return {"message": "Ερμής RAG API is running", "status": "active"}


@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Query the RAG system with a question.
    """
    try:
        # Mock response for testing without RAG service
        # Remove this and uncomment the real implementation below
        return QueryResponse(
            answer="Αυτή είναι μια δοκιμαστική απάντηση. Για να λειτουργήσει το πραγματικό σύστημα RAG, παρακαλώ ρυθμίστε το backend με τα αρχεία που παρείχατε.",
            context=[
                "Παράδειγμα πηγής 1",
                "Παράδειγμα πηγής 2"
            ],
            scores=[0.95, 0.87]
        )
        
        # Real implementation (uncomment when ready):
        # answer, context_texts, scores, metas = rag_service.answer(request.question)
        # return QueryResponse(
        #     answer=answer,
        #     context=context_texts,
        #     scores=scores
        # )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Ερμής RAG"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
