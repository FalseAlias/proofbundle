"""
Boundary policy evaluation.
evaluate_atom and evaluate_boundary with all defined atoms.
Operates on the SPEC-format boundary structure.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union


class BoundaryError(Exception):
    pass


def _resolve_from_context(ctx: Dict[str, Any], key: str) -> Any:
    """Resolve a value from the context by key."""
    return ctx.get(key)


def _to_iso_date(v: Any) -> Optional[datetime]:
    """Parse an ISO 8601 date string to a datetime object."""
    if isinstance(v, datetime):
        return v
    if isinstance(v, str):
        try:
            # Handle various ISO 8601 formats
            v = v.replace("Z", "+00:00")
            return datetime.fromisoformat(v)
        except (ValueError, TypeError):
            return None
    return None


def _now_from_ctx(ctx: Dict[str, Any]) -> datetime:
    """Get the current time from context._now or use system time."""
    n = ctx.get("_now")
    if n is not None:
        d = _to_iso_date(n)
        if d is not None:
            return d
    return datetime.now(timezone.utc)


def _parse_duration(s: str) -> float:
    """Parse a duration string into milliseconds.
    
    Format: <number><unit> where unit is one of:
    ms, s, m, h, d, w, y
    """
    if not isinstance(s, str):
        raise ValueError(f"duration must be string, got {type(s)}")
    s = s.strip()
    match = re.match(r"^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)$", s)
    if not match:
        raise ValueError(f"invalid duration format: {s}")
    amount = float(match.group(1))
    unit = match.group(2).lower()
    multipliers = {
        "ms": 1,
        "s": 1000,
        "m": 60 * 1000,
        "h": 60 * 60 * 1000,
        "d": 24 * 60 * 60 * 1000,
        "w": 7 * 24 * 60 * 60 * 1000,
        "y": 365.25 * 24 * 60 * 60 * 1000,
    }
    if unit not in multipliers:
        raise ValueError(f"unknown duration unit: {unit}")
    return amount * multipliers[unit]


def evaluate_atom(atom: Dict[str, Any], ctx: Dict[str, Any]) -> bool:
    """Evaluate a single boundary atom against the context.
    
    Returns True if the atom passes, False if it fails.
    Raises BoundaryError for malformed atoms (which leads to indeterminate).
    """
    if not isinstance(atom, dict):
        raise BoundaryError(f"atom must be an object, got {type(atom).__name__}")
    if len(atom) != 1:
        raise BoundaryError(f"atom must have exactly one key, got {len(atom)}")

    op = list(atom.keys())[0]
    operand = atom[op]

    if op == "equals":
        if not isinstance(operand, list):
            raise BoundaryError("equals operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"equals requires 2 operands, got {len(operand)}")
        key, expected = operand
        actual = _resolve_from_context(ctx, key)
        return actual == expected

    if op == "in":
        if not isinstance(operand, list):
            raise BoundaryError("in operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"in requires 2 operands, got {len(operand)}")
        key, allowed = operand
        actual = _resolve_from_context(ctx, key)
        if actual is None:
            return False
        if isinstance(allowed, list):
            return actual in allowed
        # Single value fallback
        return actual == allowed

    if op == "present":
        if not isinstance(operand, str):
            raise BoundaryError("present operand must be string")
        return operand in ctx and ctx[operand] is not None

    if op == "range":
        if not isinstance(operand, list):
            raise BoundaryError("range operand must be array")
        if len(operand) != 3:
            raise BoundaryError(f"range requires 3 operands, got {len(operand)}")
        key, lo, hi = operand
        try:
            lo = float(lo)
            hi = float(hi)
        except (ValueError, TypeError):
            raise BoundaryError("range lo/hi must be numbers")
        actual = _resolve_from_context(ctx, key)
        if actual is None:
            return False
        try:
            actual = float(actual)
        except (ValueError, TypeError):
            raise BoundaryError("range value must be numeric")
        return lo <= actual <= hi

    if op == "before":
        if not isinstance(operand, list):
            raise BoundaryError("before operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"before requires 2 operands, got {len(operand)}")
        key, target_str = operand
        val = _to_iso_date(_resolve_from_context(ctx, key))
        target = _to_iso_date(target_str)
        if val is None or target is None:
            raise BoundaryError("before requires valid dates")
        return val < target

    if op == "after":
        if not isinstance(operand, list):
            raise BoundaryError("after operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"after requires 2 operands, got {len(operand)}")
        key, target_str = operand
        val = _to_iso_date(_resolve_from_context(ctx, key))
        target = _to_iso_date(target_str)
        if val is None or target is None:
            raise BoundaryError("after requires valid dates")
        return val > target

    if op == "within":
        if not isinstance(operand, list):
            raise BoundaryError("within operand must be array")
        if len(operand) != 3:
            raise BoundaryError(f"within requires 3 operands, got {len(operand)}")
        key, start_str, end_str = operand
        val = _to_iso_date(_resolve_from_context(ctx, key))
        start = _to_iso_date(start_str)
        end = _to_iso_date(end_str)
        if val is None or start is None or end is None:
            raise BoundaryError("within requires valid dates")
        return start <= val <= end

    if op == "expired":
        if not isinstance(operand, str):
            raise BoundaryError("expired operand must be string")
        val = _to_iso_date(_resolve_from_context(ctx, operand))
        n = _now_from_ctx(ctx)
        if val is None:
            raise BoundaryError("expired requires valid date")
        return val < n

    if op == "not_expired":
        if not isinstance(operand, str):
            raise BoundaryError("not_expired operand must be string")
        val = _to_iso_date(_resolve_from_context(ctx, operand))
        n = _now_from_ctx(ctx)
        if val is None:
            raise BoundaryError("not_expired requires valid date")
        return val >= n

    if op == "age_lt":
        if not isinstance(operand, list):
            raise BoundaryError("age_lt operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"age_lt requires 2 operands, got {len(operand)}")
        key, duration_str = operand
        val = _to_iso_date(_resolve_from_context(ctx, key))
        n = _now_from_ctx(ctx)
        if val is None:
            raise BoundaryError("age_lt requires valid date")
        try:
            max_ms = _parse_duration(duration_str)
        except ValueError as e:
            raise BoundaryError(f"age_lt invalid duration: {e}")
        diff = (n - val).total_seconds() * 1000
        return diff < max_ms

    if op == "age_gt":
        if not isinstance(operand, list):
            raise BoundaryError("age_gt operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"age_gt requires 2 operands, got {len(operand)}")
        key, duration_str = operand
        val = _to_iso_date(_resolve_from_context(ctx, key))
        n = _now_from_ctx(ctx)
        if val is None:
            raise BoundaryError("age_gt requires valid date")
        try:
            min_ms = _parse_duration(duration_str)
        except ValueError as e:
            raise BoundaryError(f"age_gt invalid duration: {e}")
        diff = (n - val).total_seconds() * 1000
        return diff > min_ms

    if op == "within_last":
        if not isinstance(operand, list):
            raise BoundaryError("within_last operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"within_last requires 2 operands, got {len(operand)}")
        key, duration_str = operand
        val = _to_iso_date(_resolve_from_context(ctx, key))
        n = _now_from_ctx(ctx)
        if val is None:
            raise BoundaryError("within_last requires valid date")
        try:
            max_ms = _parse_duration(duration_str)
        except ValueError as e:
            raise BoundaryError(f"within_last invalid duration: {e}")
        diff = (n - val).total_seconds() * 1000
        return 0 <= diff <= max_ms

    if op == "within_next":
        if not isinstance(operand, list):
            raise BoundaryError("within_next operand must be array")
        if len(operand) != 2:
            raise BoundaryError(f"within_next requires 2 operands, got {len(operand)}")
        key, duration_str = operand
        val = _to_iso_date(_resolve_from_context(ctx, key))
        n = _now_from_ctx(ctx)
        if val is None:
            raise BoundaryError("within_next requires valid date")
        try:
            max_ms = _parse_duration(duration_str)
        except ValueError as e:
            raise BoundaryError(f"within_next invalid duration: {e}")
        diff = (val - n).total_seconds() * 1000
        return 0 <= diff <= max_ms

    if op == "all":
        if not isinstance(operand, list):
            raise BoundaryError("all operand must be array")
        return all(evaluate_atom(sub, ctx) for sub in operand)

    if op == "any":
        if not isinstance(operand, list):
            raise BoundaryError("any operand must be array")
        return any(evaluate_atom(sub, ctx) for sub in operand)

    if op == "not":
        if not isinstance(operand, list):
            raise BoundaryError("not operand must be array")
        if len(operand) == 0:
            return True
        return not evaluate_atom(operand[0], ctx)

    # Unknown atom type
    raise BoundaryError(f"unknown atom type: {op}")


def evaluate_boundary(boundary: Any, ctx: Dict[str, Any]) -> Optional[str]:
    """Evaluate a boundary policy against the context.
    
    Returns:
        "pass" - boundary allows
        "fail" - boundary denies (out-of-bounds)
        "indeterminate" - malformed boundary
        None - no boundary to evaluate
    """
    if boundary is None:
        return None

    if not isinstance(boundary, dict):
        return "indeterminate"

    try:
        # SPEC format: {"all": [atoms...]} or {"equals": [...]} etc.
        if "all" in boundary:
            atoms = boundary["all"]
            if not isinstance(atoms, list):
                return "indeterminate"
            for atom in atoms:
                if not evaluate_atom(atom, ctx):
                    return "fail"
            return "pass"

        # Single atom as the boundary itself
        # Check if it's a known atom operator
        result = evaluate_atom(boundary, ctx)
        return "pass" if result else "fail"

    except BoundaryError:
        return "indeterminate"
