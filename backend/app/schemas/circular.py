"""
Pydantic schemas for circulars.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

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
    published_at: Optional[date] = None
    expires_at: Optional[date] = None
    is_published: bool = False


class CircularUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=400)
    description: Optional[str] = Field(default=None, max_length=10000)
    category: Optional[CircularCategory] = None
    published_at: Optional[date] = None
    expires_at: Optional[date] = None
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None
