"""Pydantic schemas for circulars."""
from __future__ import annotations
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from app.models.circular import CircularCategory


class CircularOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    slug: str
    description: Optional[str]
    category: CircularCategory
    attachment_path: Optional[str]
    attachment_filename: Optional[str]
    published_at: Optional[date]
    expires_at: Optional[date]
    is_published: bool
    is_archived: bool


class CircularCreate(BaseModel):
    title: str = Field(min_length=3, max_length=400)
    description: Optional[str] = Field(default=None, max_length=10000)
    category: CircularCategory = CircularCategory.GENERAL
    attachment_path: Optional[str] = None
    attachment_filename: Optional[str] = None
    published_at: Optional[date] = None
    expires_at: Optional[date] = None
    is_published: bool = False

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, values: dict) -> dict:
        for f in ("description", "published_at", "expires_at", "attachment_path", "attachment_filename"):
            if isinstance(values.get(f), str) and values[f].strip() == "":
                values[f] = None
        return values


class CircularUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=400)
    description: Optional[str] = Field(default=None, max_length=10000)
    category: Optional[CircularCategory] = None
    attachment_path: Optional[str] = None
    attachment_filename: Optional[str] = None
    published_at: Optional[date] = None
    expires_at: Optional[date] = None
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, values: dict) -> dict:
        for f in ("title", "description", "published_at", "expires_at", "attachment_path", "attachment_filename"):
            if isinstance(values.get(f), str) and values[f].strip() == "":
                values[f] = None
        return values
