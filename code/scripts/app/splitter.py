from __future__ import annotations

import re
from typing import Iterable, List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


REGEX = r"ΤΙΤΛΟΣ\s+.*?(?=ΤΙΤΛΟΣ\s+|\Z)"


class TitleSplitter(RecursiveCharacterTextSplitter):
    """Splitter aware of Greek military regulation section headings."""

    def __init__(
        self,
        chunk_size: int = 1200,
        chunk_overlap: int = 120,
        separators: Iterable[str] = ("\n\n", "\n**", "\n"),
    ) -> None:
        super().__init__(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=list(separators),
        )
        self._section_re = re.compile(REGEX, flags=re.DOTALL)

    def split_text(self, text: str) -> List[str]:
        sections = self._section_re.findall(text) or [text]
        chunks: List[str] = []
        for section in sections:
            if len(section) <= self._chunk_size:
                chunks.append(section)
            else:
                chunks.extend(super().split_text(section))
        return chunks

    def split_documents(self, documents: List[Document]) -> List[Document]:
        chunks: List[Document] = []
        for doc in documents:
            for text in self.split_text(doc.page_content):
                chunks.append(Document(page_content=text, metadata=dict(doc.metadata)))
        return chunks
