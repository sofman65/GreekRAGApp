"""
Query and response models for the Ermis RAG system.
"""

from pydantic import BaseModel, Field
from typing import List, Literal


class QueryRequest(BaseModel):
    """Incoming query request model."""
    question: str = Field(..., description="The user's question")


class SourceInfo(BaseModel):
    """Chunk / source metadata returned by the RAG engine."""
    text: str
    score: float
    source: str


class QueryResponse(BaseModel):
    """Full RAG or Chat response returned to the frontend."""

    answer: str = Field(..., description="The generated answer")
    sources: List[SourceInfo] = Field(default_factory=list)
    demo_mode: bool = False

    # RAG routing mode
    mode: Literal["rag", "chat", "unsafe", "out_of_scope", "guardrail"] = "rag"

    # Classification label returned by the router
    label: str = "NEED_RAG"
