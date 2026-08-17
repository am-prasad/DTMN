"""
Event and EventCategory models.
"""
from __future__ import annotations

import enum
from datetime import date, time
from typing import Optional

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class EventCategory(Base, TimestampMixin):
    __tablename__ = "event_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)

    events: Mapped[list["Event"]] = relationship("Event", back_populates="category")


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(350), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    venue: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    registration_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("event_categories.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[Optional[EventCategory]] = relationship("EventCategory", back_populates="events")
    images: Mapped[list["EventImage"]] = relationship(
        "EventImage", back_populates="event", cascade="all, delete-orphan"
    )


class EventImage(Base, TimestampMixin):
    __tablename__ = "event_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    image_path: Mapped[str] = mapped_column(String(512), nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    event: Mapped["Event"] = relationship("Event", back_populates="images")
