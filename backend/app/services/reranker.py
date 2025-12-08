"""Optional reranker layer to tighten retrieval results."""

from __future__ import annotations

from typing import Dict, List, Sequence, Tuple


class Reranker:
    def __init__(
        self,
        provider: str,
        model: str,
        top_k: int = 3,
        use_fp16: bool = True,
        device: str = "cpu",
        trust_remote_code: bool = False,
    ):
        self.top_k = top_k
        self.provider = provider

        if provider == "sentence-transformers":
            from sentence_transformers import CrossEncoder

            self._backend = CrossEncoder(
                model,
                device=device,
                trust_remote_code=trust_remote_code,
            )
        elif provider == "flagembedding":
            from FlagEmbedding import FlagReranker

            self._backend = FlagReranker(model, use_fp16=use_fp16, device=device)
        else:
            raise ValueError(f"Unsupported reranker provider: {provider}")

    def rerank(
        self,
        query: str,
        docs: Sequence[Tuple[str, float, Dict]],
    ) -> List[Tuple[str, float, Dict]]:
        if not docs:
            return []

        pairs = [(query, doc[0]) for doc in docs]
        if self.provider == "sentence-transformers":
            scores = self._backend.predict(pairs, convert_to_numpy=True).tolist()
        else:
            scores = self._backend.compute_score(pairs)

        reranked = sorted(zip(docs, scores), key=lambda x: float(x[1]), reverse=True)

        limit = self.top_k if self.top_k else len(reranked)
        trimmed = reranked[:limit]
        return [(doc[0], float(score), doc[2]) for doc, score in trimmed]
