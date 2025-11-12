from __future__ import annotations

import sys

from app.rag_service import RAGService


def main() -> None:
    cfg = sys.argv[1] if len(sys.argv) > 1 else "scripts/config.yml"
    service = RAGService(cfg)
    service.ingest_corpus()
    print("✓ Ingestion complete.")


if __name__ == "__main__":
    main()
