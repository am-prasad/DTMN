"""
Activity and ActivityCategory models.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class ActivityCategory(Base, TimestampMixin):
    __tablename__ = "activity_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)

    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="category")


class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(350), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("activity_categories.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[Optional[ActivityCategory]] = relationship("ActivityCategory", back_populates="activities")
    images: Mapped[list["ActivityImage"]] = relationship(
        "ActivityImage", back_populates="activity", cascade="all, delete-orphan"
    )


class ActivityImage(Base, TimestampMixin):
    __tablename__ = "activity_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    activity_id: Mapped[int] = mapped_column(
        ForeignKey("activities.id", ondelete="CASCADE"), nullable=False
    )
    image_path: Mapped[str] = mapped_column(String(512), nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    activity: Mapped["Activity"] = relationship("Activity", back_populates="images")
