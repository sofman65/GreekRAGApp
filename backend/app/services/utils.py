from __future__ import annotations

import time
from pathlib import Path
from typing import Iterable

import yaml


class Timer:
    """Context manager for lightweight performance timing."""

    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        self.seconds = 0.0
        return self

    def __exit__(self, *exc_info) -> None:
        self.seconds = time.perf_counter() - self._start


def load_cfg(path: str) -> dict:
    """Load a YAML configuration file."""

    cfg_path = Path(path).expanduser().resolve()
    with cfg_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def iter_files(root: Path, extensions: Iterable[str]):
    """Yield all files in *root* whose suffix is in *extensions*."""

    exts = {ext.lower() for ext in extensions}
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in exts:
            yield path

