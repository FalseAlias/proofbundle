"""
PB-CANON-JSON-1 canonicalization.
Restricted JSON subset: null, bool, integers in [-(2^53-1), 2^53-1],
NFC-normalized strings, arrays, objects. No whitespace. Sorted keys.
Deterministic. Pure function from JSON value to UTF-8 bytes.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, List, Mapping, Sequence, Union

CanonValue = Union[None, bool, int, str, List["CanonValue"], Dict[str, "CanonValue"]]


class CanonError(Exception):
    """Raised when a value cannot be canonicalized."""

    pass


# JSON safe integer range
MAX_SAFE_INTEGER = 2**53 - 1
MIN_SAFE_INTEGER = -(2**53 - 1)


def _is_safe_integer(n: int) -> bool:
    return MIN_SAFE_INTEGER <= n <= MAX_SAFE_INTEGER


def _classify(value: Any, path: str) -> "Tagged":
    """Classify and validate a Python value into a tagged internal form."""
    if value is None:
        return TaggedNull()
    if isinstance(value, bool):
        return TaggedBool(value)
    if isinstance(value, int):
        if not _is_safe_integer(value):
            raise CanonError(f"non-safe-integer number at {path}: {value}")
        return TaggedInt(value)
    if isinstance(value, float):
        raise CanonError(f"non-safe-integer number at {path}: {value}")
    if isinstance(value, str):
        s = unicodedata.normalize("NFC", value)
        # Reject lone surrogates (only possible in Python if someone
        # manually constructs a string with surrogate code points)
        for ch in s:
            cp = ord(ch)
            if 0xD800 <= cp <= 0xDFFF:
                raise CanonError(f"unpaired surrogate at {path}")
        return TaggedStr(s)
    if isinstance(value, (list, tuple)):
        items: List[Tagged] = []
        for i, item in enumerate(value):
            items.append(_classify(item, f"{path}[{i}]"))
        return TaggedArr(items)
    if isinstance(value, dict):
        obj: Dict[str, Tagged] = {}
        keys = sorted(value.keys(), key=lambda k: _utf8_key(k))
        for k in keys:
            obj[k] = _classify(value[k], f"{path}.{k}")
        return TaggedObj(obj)
    raise CanonError(f"unsupported type at {path}: {type(value).__name__}")


def _utf8_key(k: str) -> bytes:
    """Return UTF-8 bytes of key for sorting."""
    return k.encode("utf-8")


class Tagged:
    """Base class for tagged (classified) values."""

    def emit(self) -> str:
        raise NotImplementedError  # pragma: no cover


class TaggedNull(Tagged):
    def emit(self) -> str:
        return "null"


class TaggedBool(Tagged):
    def __init__(self, v: bool) -> None:
        self.v = v

    def emit(self) -> str:
        return "true" if self.v else "false"


class TaggedInt(Tagged):
    def __init__(self, v: int) -> None:
        self.v = v

    def emit(self) -> str:
        return str(self.v)


class TaggedStr(Tagged):
    def __init__(self, v: str) -> None:
        self.v = v

    def emit(self) -> str:
        return _quote(self.v)


class TaggedArr(Tagged):
    def __init__(self, items: List[Tagged]) -> None:
        self.items = items

    def emit(self) -> str:
        return "[" + ",".join(item.emit() for item in self.items) + "]"


class TaggedObj(Tagged):
    def __init__(self, mapping: Dict[str, Tagged]) -> None:
        self.mapping = mapping

    def emit(self) -> str:
        parts = []
        for k, v in self.mapping.items():
            parts.append(_quote(k) + ":" + v.emit())
        return "{" + ",".join(parts) + "}"


def _quote(s: str) -> str:
    """Quote a string for JSON output with proper escaping."""
    out = '"'
    for ch in s:
        cp = ord(ch)
        if ch == '"':
            out += '\\"'
        elif ch == '\\':
            out += '\\\\'
        elif ch == '\b':
            out += '\\b'
        elif ch == '\f':
            out += '\\f'
        elif ch == '\n':
            out += '\\n'
        elif ch == '\r':
            out += '\\r'
        elif ch == '\t':
            out += '\\t'
        elif cp < 0x20:
            out += f"\\u{cp:04x}"
        else:
            out += ch
    out += '"'
    return out


def canonical_json(value: Any) -> str:
    """Return the canonical JSON string for a value."""
    tagged = _classify(value, "$")
    return tagged.emit()


def canonical_bytes(value: Any) -> bytes:
    """Return the canonical JSON as UTF-8 encoded bytes."""
    return canonical_json(value).encode("utf-8")
