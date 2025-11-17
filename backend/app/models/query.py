"""
Query and response models
"""

from pydantic import BaseModel, Field
from typing import List


class QueryRequest(BaseModel):
    """Query request model"""
    question: str


class SourceInfo(BaseModel):
    """Source information model"""
    text: str
    score: float
    source: str


class QueryResponse(BaseModel):
    """Query response model"""
    answer: str
    sources: List[SourceInfo] = Field(default_factory=list)
    demo_mode: bool = False
    mode: str = "rag"
    label: str = "NEED_RAG"
