"""
Admissions information and enquiry models.
"""
from __future__ import annotations

import enum
from typing import Optional

from sqlalchemy import Boolean, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class EnquiryStatus(str, enum.Enum):
    NEW = "new"
    REVIEWED = "reviewed"
    RESPONDED = "responded"
    CLOSED = "closed"


class AdmissionInfo(Base, TimestampMixin):
    """Per-section admission information, managed by admissions admin."""
    __tablename__ = "admission_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    section_slug: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )  # nursery | primary | high-school | college | general
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eligibility: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    process: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    important_dates: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    documents_required: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fee_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    faqs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    contact_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class AdmissionEnquiry(Base, TimestampMixin):
    """Submitted enquiry/application from a prospective student/parent."""
    __tablename__ = "admission_enquiries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    section: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[EnquiryStatus] = mapped_column(
        Enum(EnquiryStatus, native_enum=True),
        nullable=False,
        default=EnquiryStatus.NEW,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Admin notes
