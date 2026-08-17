"""
Pydantic schemas for activities.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


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

    # @field_validator("video_url")
    @classmethod
    def validate_video_url(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            if not v.startswith(("https://www.youtube.com/", "https://youtu.be/", "https://vimeo.com/")):
                raise ValueError("Only YouTube and Vimeo video URLs are allowed.")
        return v or None


class ActivityUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=300)
    description: Optional[str] = Field(default=None, max_length=50000)
    activity_date: Optional[date] = None
    video_url: Optional[str] = Field(default=None, max_length=512)
    category_id: Optional[int] = None
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None
