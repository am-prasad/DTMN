"""
Faculty and Department models.
"""
from __future__ import annotations

import enum
from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class AcademicSectionSlug(str, enum.Enum):
    NURSERY = "nursery"
    PRIMARY = "primary"
    HIGH_SCHOOL = "high-school"
    COLLEGE = "college"
    INSTITUTION = "institution"


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    section: Mapped[AcademicSectionSlug] = mapped_column(
        Enum(AcademicSectionSlug, name="academic_section_slug"), nullable=False
    )

    faculty: Mapped[list["Faculty"]] = relationship("Faculty", back_populates="department")


class Faculty(Base, TimestampMixin):
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    designation: Mapped[str] = mapped_column(String(255), nullable=False)
    qualification: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    experience_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    # Institutional email only — not personal
    institutional_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    section: Mapped[AcademicSectionSlug] = mapped_column(
        Enum(AcademicSectionSlug, name="academic_section_slug", create_constraint=False),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    department: Mapped[Optional[Department]] = relationship("Department", back_populates="faculty")
