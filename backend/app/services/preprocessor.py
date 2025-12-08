"""Lightweight query preprocessing helpers."""

import re
from typing import Dict


ACRONYM_PATTERN = r"^[Α-Ω]{3,}$"


def preprocess_query(query: str) -> Dict:
    """Detect acronyms or other patterns that need special handling."""
    normalized = query.strip()

    if re.match(ACRONYM_PATTERN, normalized):
        # Acronym not guaranteed to exist in corpus; force guardrail if no hit.
        return {"query": normalized, "route": "rag", "force_no_answer": True}

    return {"query": normalized, "route": None, "force_no_answer": False}
