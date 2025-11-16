"""
Query and response models
"""

from pydantic import BaseModel
from typing import List, Optional


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
    sources: List[SourceInfo] = []
    demo_mode: bool = False

