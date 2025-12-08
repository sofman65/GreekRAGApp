from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

import numpy as np
import weaviate
from weaviate.classes.config import DataType, Property
from weaviate.classes.query import MetadataQuery

try:
    from weaviate.classes.config import Configure
except Exception:
    Configure = None


class VectorDB:
    """Abstraction layer over Weaviate."""

    def __init__(self, cfg: Dict, emb_factory) -> None:
        self.cfg = cfg
        self.emb_factory = emb_factory
        self.backend = cfg["backend"]

        if self.backend == "weaviate":
            # Prefer env var (for Docker) over config file
            url = os.getenv("WEAVIATE_URL") or cfg["weaviate"].get("url")
            if url:
                from urllib.parse import urlparse

                parsed = urlparse(url)
                host = parsed.hostname or "localhost"
                port = parsed.port or 8080
                self.client = weaviate.connect_to_local(host=host, port=port)
            else:
                self.client = weaviate.connect_to_local()
            self.class_name = cfg["weaviate"]["class_name"]
            self.text_key = cfg["weaviate"].get("text_key", "text")
            self._ensure_class()
        else:
            raise ValueError(f"Unsupported vector backend: {self.backend}")

    def _ensure_class(self) -> None:
        collections = self.client.collections.list_all(simple=True)
        if self.class_name in collections:
            return

        kwargs = {}
        if Configure is not None:
            kwargs["vectorizer_config"] = Configure.Vectorizer.none()

        self.client.collections.create(
            name=self.class_name,
            properties=[
                Property(name=self.text_key, data_type=DataType.TEXT),
            ],
            **kwargs,
        )

    def add_documents(self, texts: Sequence[str], metas: Sequence[Dict]) -> None:
        if self.backend == "weaviate":
            embeddings = self.emb_factory.embed_texts(list(texts))
            coll = self.client.collections.get(self.class_name)
            with coll.batch.dynamic() as batch:
                for text, meta, vec in zip(texts, metas, embeddings):
                    props = {self.text_key: text, **meta}
                    batch.add_object(properties=props, vector=vec)
            return

    def persist(self) -> None:
        pass

    def similarity_search(
        self,
        query: str,
        k: int,
    ) -> List[Tuple[str, float, Dict]]:
        if self.backend == "weaviate":
            coll = self.client.collections.get(self.class_name)
            qvec = self.emb_factory.embed_query(query)
            result = coll.query.near_vector(
                near_vector=qvec,
                limit=k,
                return_metadata=MetadataQuery(distance=True, score=True, certainty=True),
            )
            hits = []
            for obj in result.objects:
                text = obj.properties.get(self.text_key, "")
                md = getattr(obj, "metadata", None)
                score = 0.0
                if md is not None:
                    distance = getattr(md, "distance", None)
                    raw_score = getattr(md, "score", None)
                    certainty = getattr(md, "certainty", None)

                    if distance is not None:
                        # Convert cosine distance (lower is better) to similarity
                        score = max(0.0, 1.0 - float(distance))
                    elif raw_score is not None:
                        score = float(raw_score)
                    elif certainty is not None:
                        score = float(certainty)
                hits.append((text, float(score), obj.properties))
            return hits

        return []
