from __future__ import annotations

from typing import List

from langchain_ollama import OllamaEmbeddings
import os


class EmbeddingFactory:
    """Factory that abstracts different embedding backends."""

    def __init__(self, provider: str, model: str, batch_size: int = 16):
        self.provider = provider
        self.model = model
        self.batch_size = batch_size

        if provider == "ollama":
            base_url = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
            self._backend = OllamaEmbeddings(model=model, base_url=base_url)
        elif provider == "st":
            from sentence_transformers import SentenceTransformer

            self._backend = SentenceTransformer(model)
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if hasattr(self._backend, "embed_documents"):
            return self._backend.embed_documents(texts)

        # sentence-transformers backend
        return self._backend.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=False,
        ).tolist()

    def embed_query(self, text: str) -> List[float]:
        if hasattr(self._backend, "embed_query"):
            return self._backend.embed_query(text)

        return self._backend.encode([text])[0].tolist()
