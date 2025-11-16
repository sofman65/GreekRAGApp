"""
Document ingestion script for Ερμής RAG System
Run this to index documents from the corpus directory
"""

from __future__ import annotations

import sys
import os
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.rag_service import RAGService


def main() -> None:
    config_path = os.getenv("RAG_CONFIG_PATH", "backend/config/config.yml")
    
    print("🔄 Starting document ingestion...")
    print(f"📄 Using config: {config_path}")
    
    try:
        service = RAGService(config_path)
        service.ingest_corpus()
        print("✓ Ingestion complete!")
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print("💡 Make sure your corpus directory exists with documents to ingest.")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Ingestion failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

