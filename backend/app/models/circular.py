"""
Circular / Notice model.
"""
from __future__ import annotations

import enum
from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class CircularCategory(str, enum.Enum):
    GENERAL = "general"
    ADMISSIONS = "admissions"
    EXAMINATION = "examination"
    HOLIDAYS = "holidays"
    EVENTS = "events"
    ACADEMIC = "academic"
    ADMINISTRATION = "administration"


class Circular(Base, TimestampMixin):
    __tablename__ = "circulars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(400), nullable=False)
    slug: Mapped[str] = mapped_column(String(450), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[CircularCategory] = mapped_column(
        Enum(CircularCategory, native_enum=True),
        nullable=False,
        default=CircularCategory.GENERAL,
    )
    attachment_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    attachment_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    published_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expires_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
