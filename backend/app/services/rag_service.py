from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from langchain_core.documents import Document

from app.services.embeddings import EmbeddingFactory
from app.services.loaders import load_doc
from app.services.reranker import Reranker
from app.services.splitter import TitleSplitter
from app.services.utils import iter_files, load_cfg
from app.services.vectordb import VectorDB
from app.services.constants import NO_CONTEXT_RESPONSE


class RAGService:
    """High-level orchestration for ingesting and querying the RAG system."""

    def __init__(self, cfg_path: str):
        self.logger = logging.getLogger(__name__)
        self.cfg_path = cfg_path
        self.cfg = load_cfg(cfg_path)

        splitter_cfg = self.cfg["splitter"]
        self.splitter = TitleSplitter(
            chunk_size=splitter_cfg["chunk_size"],
            chunk_overlap=splitter_cfg["chunk_overlap"],
            separators=splitter_cfg.get(
                "separators", ("\n\n", "\n**", "\n")
            ),
        )

        self.emb_factory = EmbeddingFactory(**self.cfg["embeddings"])
        self.vector_db = VectorDB(self.cfg["vector_db"], self.emb_factory)

        self.reranker = None
        reranker_cfg = self.cfg.get("reranker", {})
        if reranker_cfg.get("enabled"):
            try:
                self.reranker = Reranker(
                    provider=reranker_cfg["provider"],
                    model=reranker_cfg["model"],
                    top_k=reranker_cfg.get("top_k", 3),
                    use_fp16=reranker_cfg.get("use_fp16", True),
                    device=reranker_cfg.get("device", "cpu"),
                    trust_remote_code=reranker_cfg.get("trust_remote_code", False),
                )
                self.logger.info("Reranker loaded: %s", reranker_cfg["model"])
            except Exception as exc:
                self.logger.warning("Reranker disabled due to init error: %s", exc)
                self.reranker = None

        self._llm = None
        self.llm_cfg = self.cfg["llm"]
        self.system_prompt = self.llm_cfg.get(
            "system_prompt",
            "Είσαι ο Ερμής, ένας αυστηρός RAG βοηθός. "
            "Απάντησε μόνο με βάση τα παρεχόμενα αποσπάσματα.",
        )

    def ingest_corpus(self) -> None:
        corpus_cfg = self.cfg["corpus"]
        root = Path(corpus_cfg["input_dir"]).expanduser().resolve()
        if not root.exists():
            raise FileNotFoundError(f"Corpus directory not found: {root}")

        extensions = corpus_cfg.get("file_types", [])
        batch_texts: List[str] = []
        batch_meta: List[Dict] = []

        for path in iter_files(root, extensions):
            documents = load_doc(path)
            chunks = self.splitter.split_documents(documents)
            for chunk in chunks:
                metadata = dict(chunk.metadata)
                metadata.setdefault("source", str(path))
                batch_texts.append(chunk.page_content)
                batch_meta.append(metadata)

                if len(batch_texts) >= 1000:
                    self.vector_db.add_documents(batch_texts, batch_meta)
                    batch_texts.clear()
                    batch_meta.clear()

        if batch_texts:
            self.vector_db.add_documents(batch_texts, batch_meta)

        self.vector_db.persist()

    def _ensure_llm(self) -> None:
        if self._llm is None:
            from app.services.llm_providers import LLMFactory

            self._llm = LLMFactory(**self.llm_cfg)

    def retrieve(self, question: str) -> Tuple[List[str], List[float], List[Dict]]:
        k = self.cfg["vector_db"].get("top_k", 6)
        hits = self.vector_db.similarity_search(question, k=k)
        if not hits:
            return [], [], []

        if self.reranker:
            hits = self.reranker.rerank(question, hits)

        texts = [hit[0] for hit in hits]
        scores = [hit[1] for hit in hits]
        metas = [hit[2] for hit in hits]

        return texts, scores, metas

    def _build_prompt(self, question: str, ctx_texts: List[str]) -> str:
        if ctx_texts:
            joined = "\n\n---\n\n".join(ctx_texts)
            return (
                "Χρησιμοποίησε ΜΟΝΟ τα παρακάτω αποσπάσματα. "
                "Μην προσθέτεις πληροφορίες που δεν υπάρχουν στο κείμενο.\n"
                f"Αποσπάσματα εγγράφων:\n{joined}\n\nΕρώτηση: {question}\n\n"
                "Επέστρεψε μόνο την απάντηση στα ελληνικά."
            )

        return (
            "Απάντησε την ερώτηση που ακολουθεί στα ελληνικά."
            f"\n\nΕρώτηση: {question}"
        )

    def answer(
        self,
        question: str,
        ctx_texts: Optional[List[str]] = None,
        scores: Optional[List[float]] = None,
        metas: Optional[List[Dict]] = None,
    ) -> Tuple[str, List[str], List[float], List[Dict]]:
        self._ensure_llm()

        if ctx_texts is None or scores is None or metas is None:
            ctx_texts, scores, metas = self.retrieve(question)

        if not ctx_texts:
            return NO_CONTEXT_RESPONSE, [], [], []

        prompt = self._build_prompt(question, ctx_texts)
        response = self._llm.answer(self.system_prompt, prompt)
        return response, ctx_texts, scores, metas

    def stream_answer(
        self,
        question: str,
        ctx_texts: Optional[List[str]] = None,
        scores: Optional[List[float]] = None,
        metas: Optional[List[Dict]] = None,
    ):
        """Stream answer tokens from the RAG system."""
        self._ensure_llm()

        if ctx_texts is None or scores is None or metas is None:
            ctx_texts, scores, metas = self.retrieve(question)

        if not ctx_texts:
            yield NO_CONTEXT_RESPONSE
            return

        prompt = self._build_prompt(question, ctx_texts)

        for token in self._llm.stream_answer(self.system_prompt, prompt):
            yield token
