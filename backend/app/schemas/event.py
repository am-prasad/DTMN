"""Pydantic schemas for events."""
from __future__ import annotations
from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from slugify import slugify


class EventCategoryOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    slug: str


class EventImageOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    image_path: str
    caption: Optional[str]
    sort_order: int


class EventOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    slug: str
    description: Optional[str]
    event_date: date
    start_time: Optional[time]
    end_time: Optional[time]
    venue: Optional[str]
    cover_image: Optional[str]
    registration_url: Optional[str]
    is_published: bool
    is_archived: bool
    category: Optional[EventCategoryOut]
    images: list[EventImageOut] = []


class EventListOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    slug: str
    event_date: date
    start_time: Optional[time]
    venue: Optional[str]
    cover_image: Optional[str]
    is_published: bool
    category: Optional[EventCategoryOut]


class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    description: Optional[str] = Field(default=None, max_length=50000)
    event_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    venue: Optional[str] = Field(default=None, max_length=300)
    registration_url: Optional[str] = Field(default=None, max_length=512)
    category_id: Optional[int] = None
    is_published: bool = False

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, values: dict) -> dict:
        for f in ("description", "start_time", "end_time", "venue", "registration_url"):
            if isinstance(values.get(f), str) and values[f].strip() == "":
                values[f] = None
        cat = values.get("category_id")
        if cat is not None and cat != cat:
            values["category_id"] = None
        return values

    @field_validator("title")
    @classmethod
    def sanitize_title(cls, v: str) -> str:
        return v.strip()


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=300)
    description: Optional[str] = Field(default=None, max_length=50000)
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    venue: Optional[str] = Field(default=None, max_length=300)
    registration_url: Optional[str] = Field(default=None, max_length=512)
    category_id: Optional[int] = None
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def coerce_empty_strings(cls, values: dict) -> dict:
        for f in ("title", "description", "start_time", "end_time", "venue", "registration_url"):
            if isinstance(values.get(f), str) and values[f].strip() == "":
                values[f] = None
        cat = values.get("category_id")
        if cat is not None and cat != cat:
            values["category_id"] = None
        return values
