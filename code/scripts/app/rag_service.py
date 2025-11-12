from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

from langchain_core.documents import Document

from app.embeddings import EmbeddingFactory
from app.loaders import load_doc
from app.splitter import TitleSplitter
from app.utils import iter_files, load_cfg
from app.vectordb import VectorDB


SYSTEM_PROMPT = (
    "Είσαι μια έμπειρη βοηθός στα ελληνικά για διακλαδικούς κανονισμούς. "
    "Απάντησε με σαφήνεια. Εάν παρέχεται κείμενο, βασίσου σε αυτό. "
    "Εάν δεν σχετίζεται, απάντησε χωρίς να το χρησιμοποιήσεις."
)


class RAGService:
    """High-level orchestration for ingesting and querying the RAG system."""

    def __init__(self, cfg_path: str):
        self.cfg_path = cfg_path
        self.cfg = load_cfg(cfg_path)

        splitter_cfg = self.cfg["splitter"]
        self.splitter = TitleSplitter(
            chunk_size=splitter_cfg["chunk_size"],
            chunk_overlap=splitter_cfg["chunk_overlap"],
        )

        self.emb_factory = EmbeddingFactory(**self.cfg["embeddings"])
        self.vector_db = VectorDB(self.cfg["vector_db"], self.emb_factory)

        self.reranker = None

        self._llm = None
        self.llm_cfg = self.cfg["llm"]

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
            from app.llm_providers import LLMFactory

            self._llm = LLMFactory(**self.llm_cfg)

    def retrieve(self, question: str) -> Tuple[List[str], List[float], List[Dict]]:
        k = self.cfg["vector_db"].get("top_k", 6)
        hits = self.vector_db.similarity_search(question, k=k)
        if not hits:
            return [], [], []

        texts = [hit[0] for hit in hits]
        scores = [hit[1] for hit in hits]
        metas = [hit[2] for hit in hits]

        return texts, scores, metas

    def answer(self, question: str) -> Tuple[str, List[str], List[float], List[Dict]]:
        self._ensure_llm()

        ctx_texts, scores, metas = self.retrieve(question)
        if ctx_texts:
            joined = "\n\n---\n\n".join(ctx_texts)
            prompt = (
                "Απάντησε την ερώτηση χρησιμοποιώντας κατάλληλα αποσπάσματα εφόσον σχετίζονται.\n"
                f"Κείμενο:\n{joined}\n\nΕρώτηση: {question}\n\n"
                "Επέστρεψε ΜΟΝΟ την απάντηση στα ελληνικά."
            )
        else:
            prompt = (
                "Απάντησε την ερώτηση που ακολουθεί στα ελληνικά."
                f"\n\nΕρώτηση: {question}"
            )

        response = self._llm.answer(SYSTEM_PROMPT, prompt)
        return response, ctx_texts, scores, metas
    
    def stream_answer(self, question: str):
        """Stream answer tokens from the RAG system."""
        self._ensure_llm()

        ctx_texts, scores, metas = self.retrieve(question)
        if ctx_texts:
            joined = "\n\n---\n\n".join(ctx_texts)
            prompt = (
                "Απάντησε την ερώτηση χρησιμοποιώντας κατάλληλα αποσπάσματα εφόσον σχετίζονται.\n"
                f"Κείμενο:\n{joined}\n\nΕρώτηση: {question}\n\n"
                "Επέστρεψε ΜΟΝΟ την απάντηση στα ελληνικά."
            )
        else:
            prompt = (
                "Απάντησε την ερώτηση που ακολουθεί στα ελληνικά."
                f"\n\nΕρώτηση: {question}"
            )

        for token in self._llm.stream_answer(SYSTEM_PROMPT, prompt):
            yield token
