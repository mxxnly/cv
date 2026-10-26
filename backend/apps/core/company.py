"""Loads config/company.json: the single source of company data for the whole project.

A leaf may be a plain value (real data) or ``{"value": ..., "placeholder": true}`` (temporary data).
``load_company()`` returns the resolved tree plus the list of placeholder paths so that the build,
the API and the templates can all react to unfinished data in the same way.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Company:
    data: dict[str, Any]
    placeholders: list[str] = field(default_factory=list)
    path: Path | None = None

    @property
    def has_placeholders(self) -> bool:
        return bool(self.placeholders)

    def get(self, dotted: str, default: Any = None) -> Any:
        node: Any = self.data
        for part in dotted.split("."):
            if not isinstance(node, dict) or part not in node:
                return default
            node = node[part]
        return node

    def public(self) -> dict[str, Any]:
        """The subset that is safe to expose through the public API."""
        d = self.data
        return {
            "brand": d.get("brand", {}),
            "seller": {
                k: d.get("seller", {}).get(k)
                for k in (
                    "legal_form",
                    "legal_name",
                    "legal_name_en",
                    "tax_id",
                    "address",
                    "address_en",
                    "country",
                )
            },
            "contacts": d.get("contacts", {}),
            "site": d.get("site", {}),
            "payment": {
                "provider": d.get("payment", {}).get("provider"),
                "cards_processed_on_site": d.get("payment", {}).get(
                    "cards_processed_on_site", False
                ),
            },
            "pricing": d.get("pricing", {}),
            "analytics": d.get("analytics", {}),
            "legal": d.get("legal", {}),
            "placeholders": list(self.placeholders),
        }


def _resolve(node: Any, trail: str, found: list[str]) -> Any:
    if isinstance(node, dict):
        if "value" in node and isinstance(node.get("placeholder"), bool):
            if node["placeholder"]:
                found.append(trail)
            return node["value"]
        out = {}
        for key, child in node.items():
            if key.startswith("_"):
                continue
            if key.endswith("_placeholder") and child is True:
                found.append(f"{trail}.{key[: -len('_placeholder')]}".lstrip("."))
                continue
            out[key] = _resolve(child, f"{trail}.{key}".lstrip("."), found)
        return out
    if isinstance(node, list):
        return [_resolve(item, f"{trail}[{i}]", found) for i, item in enumerate(node)]
    return node


def default_path() -> Path:
    # backend/apps/core/company.py → <repo>/config/company.json (Docker: /config/company.json)
    return Path(__file__).resolve().parents[3] / "config" / "company.json"


def load_company(path: Path | str | None = None) -> Company:
    file = Path(path) if path else default_path()
    raw = json.loads(file.read_text(encoding="utf-8"))
    found: list[str] = []
    data = _resolve(raw, "", found)
    return Company(data=data, placeholders=sorted(found), path=file)
