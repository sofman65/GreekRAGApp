from __future__ import annotations

from pathlib import Path
from typing import List

from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredMarkdownLoader,
)


def load_doc(path: Path) -> List:
    """Load a document from *path* using the appropriate loader."""

    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return PyPDFLoader(str(path)).load()
    if suffix == ".md":
        return UnstructuredMarkdownLoader(str(path)).load()
    raise ValueError(f"Unsupported file extension: {path}")
