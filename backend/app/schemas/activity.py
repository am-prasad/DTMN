"""Pydantic schemas for activities."""
from __future__ import annotations
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class ActivityCategoryOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    slug: str


class ActivityImageOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    image_path: str
    caption: Optional[str]
    sort_order: int


class ActivityOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    slug: str
    description: Optional[str]
    activity_date: Optional[date]
    video_url: Optional[str]
    is_published: bool
    is_archived: bool
    category: Optional[ActivityCategoryOut]
    images: list[ActivityImageOut] = []


class ActivityListOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    slug: str
    activity_date: Optional[date]
    is_published: bool
    category: Optional[ActivityCategoryOut]
    images: list[ActivityImageOut] = []


class ActivityCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    description: Optional[str] = Field(default=None, max_length=50000)
    activity_date: Optional[date] = None
    video_url: Optional[str] = Field(default=None, max_length=512)
    category_id: Optional[int] = None
    is_published: bool = False

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, values: dict) -> dict:
        for f in ("description", "video_url", "activity_date"):
            if isinstance(values.get(f), str) and values[f].strip() == "":
                values[f] = None
        cat = values.get("category_id")
        if cat is not None and cat != cat:
            values["category_id"] = None
        return values


class ActivityUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=300)
    description: Optional[str] = Field(default=None, max_length=50000)
    activity_date: Optional[date] = None
    video_url: Optional[str] = Field(default=None, max_length=512)
    category_id: Optional[int] = None
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, values: dict) -> dict:
        for f in ("title", "description", "video_url", "activity_date"):
            if isinstance(values.get(f), str) and values[f].strip() == "":
                values[f] = None
        cat = values.get("category_id")
        if cat is not None and cat != cat:
            values["category_id"] = None
        return values
