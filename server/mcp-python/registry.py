"""
Tool registry — centralised catalog shared by MCP and REST servers.
Mirrors server/mcp/src/registry.ts exactly.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Callable, Awaitable


@dataclass
class ToolResult:
    success: bool
    data: Any | None = None
    error: str | None = None

    def to_json(self) -> str:
        d: dict[str, Any] = {"success": self.success}
        if self.data is not None:
            d["data"] = self.data
        if self.error is not None:
            d["error"] = self.error
        return json.dumps(d, indent=2, default=str)


@dataclass
class ToolDefinition:
    name: str
    description: str
    category: str
    input_schema: dict[str, Any]  # JSON Schema dict
    handler: Callable[..., Awaitable[ToolResult]]


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}

    def register(self, tool: ToolDefinition) -> None:
        if tool.name in self._tools:
            raise ValueError(f'Tool "{tool.name}" is already registered')
        self._tools[tool.name] = tool

    def register_all(self, tools: list[ToolDefinition]) -> None:
        for tool in tools:
            self.register(tool)

    def get_tool(self, name: str) -> ToolDefinition | None:
        return self._tools.get(name)

    def get_all(self) -> list[ToolDefinition]:
        return list(self._tools.values())

    def get_by_category(self, category: str) -> list[ToolDefinition]:
        return [t for t in self._tools.values() if t.category == category]

    def get_categories(self) -> list[str]:
        return list({t.category for t in self._tools.values()})

    def count(self) -> int:
        return len(self._tools)


registry = ToolRegistry()
