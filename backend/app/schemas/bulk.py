"""Shared schemas for bulk admin actions."""
from __future__ import annotations
from pydantic import BaseModel, Field


class BulkActionRequest(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=200)
    action: str = Field(description="delete | publish | unpublish | activate | deactivate")


class BulkActionResponse(BaseModel):
    affected: int
    action: str
    message: str
