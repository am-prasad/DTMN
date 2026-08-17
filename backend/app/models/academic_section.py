"""
Academic Section content model.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class AcademicSection(Base, TimestampMixin):
    __tablename__ = "academic_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )  # nursery | primary | high-school | college
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[Optional[str]] = mapped_column(String(400), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    programs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON or markdown
    curriculum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    achievements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Section head
    head_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    head_designation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    head_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    head_photo: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    cover_image: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
