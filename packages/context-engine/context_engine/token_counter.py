"""
Token Counter (Sprint 2 — S2-003)

Counts tokens using tiktoken for budget management.
Supports per-model tokenization and batch counting.

Blueprint Section 7 — Budget stage of the 7-stage pipeline.

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
from typing import Any

import tiktoken

# Cache encodings to avoid repeated lookups
_encoder_cache: dict[str, tiktoken.Encoding] = {}

# Default encoding used across the context engine.
# cl100k_base is compatible with Claude's tokenization model.
DEFAULT_ENCODING = "cl100k_base"

# Model context-window limits (Blueprint §7).
# The engine uses cl100k_base as the standard encoding for all counting.
_MODEL_LIMITS: dict[str, int] = {
    "cl100k_base": 128000,
    "claude-3-opus": 200000,
    "claude-3-sonnet": 200000,
    "claude-3-haiku": 200000,
    "gpt-4": 8192,
    "gpt-4-turbo-preview": 128000,
}


def _get_encoder(model: str) -> tiktoken.Encoding:
    """Get tiktoken encoding, initializing via cache.

    Args:
        model: An encoding name (e.g. ``cl100k_base``) or an OpenAI model
               name (e.g. ``gpt-4``). Claude models always resolve to
               ``cl100k_base``.
    """
    # Normalise Claude model names to the shared encoding
    if model.startswith("claude"):
        model = DEFAULT_ENCODING

    if model not in _encoder_cache:
        try:
            _encoder_cache[model] = tiktoken.get_encoding(model)
        except ValueError:
            _encoder_cache[model] = tiktoken.encoding_for_model(model)
    return _encoder_cache[model]


def reset_cache() -> None:
    """Clear the globally cached tiktoken encoders (used for testing)."""
    global _encoder_cache
    _encoder_cache.clear()


def count_tokens(text: str, model: str = DEFAULT_ENCODING) -> int:
    """
    Count tokens in text using tiktoken for the given model/encoding.

    Args:
        text: The string to count tokens for.
        model: The tiktoken encoding or model string. Defaults to ``cl100k_base``.

    Returns:
        The precise token count.
    """
    if not text:
        return 0
    enc = _get_encoder(model)
    return len(enc.encode(text))


def count_tokens_for_object(obj: Any, model: str = DEFAULT_ENCODING) -> int:
    """
    Serialize an object to JSON and count its tokens.

    Args:
        obj: The object to serialize and count.
        model: The tiktoken encoding or model string. Defaults to ``cl100k_base``.

    Returns:
        The precise token count of the serialized object.
    """
    if obj is None:
        return 0
    obj_str = json.dumps(obj)
    return count_tokens(obj_str, model)


def estimate_tokens(char_count: int) -> int:
    """
    Fast estimation of tokens based purely on a given character count.

    Args:
        char_count: The length of characters in a document/string.

    Returns:
        Estimated token amount (assumes ~4 chars per token).
    """
    if char_count < 0:
        return 0
    return char_count // 4


def truncate_to_tokens(text: str, max_tokens: int, model: str = DEFAULT_ENCODING) -> str:
    """
    Truncate a string down to fit within a specific max_tokens length.

    Args:
        text: The text to truncate.
        max_tokens: The absolute token limit.
        model: The tiktoken encoding or model string. Defaults to ``cl100k_base``.

    Returns:
        Truncated text (decoded from tiktoken slice).
    """
    if not text:
        return ""
    if max_tokens <= 0:
        return ""

    enc = _get_encoder(model)
    tokens = enc.encode(text)

    if len(tokens) <= max_tokens:
        return text

    return enc.decode(tokens[:max_tokens])


def count_tokens_batch(items: list[str], model: str = DEFAULT_ENCODING) -> list[int]:
    """Count tokens for a list of text items.

    Args:
        items: List of strings to count.
        model: The tiktoken encoding or model string. Defaults to ``cl100k_base``.

    Returns:
        List of token counts, one per input string.
    """
    return [count_tokens(item, model) for item in items]


def estimate_context_tokens(context_package: dict, model: str = DEFAULT_ENCODING) -> dict[str, int]:
    """Estimate token counts per slot in a context package.

    Args:
        context_package: Dict of ``{slot_name: content}``.
        model: The tiktoken encoding or model string. Defaults to ``cl100k_base``.

    Returns:
        Dict mapping slot names to their estimated token counts.
    """
    result = {}
    for slot, data in context_package.items():
        if isinstance(data, str):
            result[slot] = count_tokens(data, model)
        else:
            result[slot] = count_tokens_for_object(data, model)
    return result


def get_model_limit(model: str = DEFAULT_ENCODING) -> int:
    """Return the token context-window limit for a model.

    Args:
        model: A model or encoding name.

    Returns:
        The context-window token limit. Defaults to 128000 for unknown models.
    """
    return _MODEL_LIMITS.get(model, 128000)
