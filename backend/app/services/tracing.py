from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

_TRACING_INITIALIZED = False


def init_tracing(mode: Optional[str]) -> Optional[str]:
    """Initialize optional tracing backends (e.g., Phoenix)."""
    global _TRACING_INITIALIZED

    if _TRACING_INITIALIZED:
        return mode

    normalized = (mode or "").strip().upper()
    if normalized == "PHOENIX":
        try:
            from phoenix.trace.langchain import LangChainInstrumentor

            LangChainInstrumentor().instrument()
            logger.info("Phoenix tracing enabled for LangChain components.")
            _TRACING_INITIALIZED = True
            return normalized
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.warning("Failed to initialize Phoenix tracing: %s", exc)
            normalized = None

    elif normalized == "LANGSMITH":
        logger.warning("LangSmith tracing requested but not yet implemented.")
        normalized = None

    _TRACING_INITIALIZED = bool(normalized)
    return normalized or None
