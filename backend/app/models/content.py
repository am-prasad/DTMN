"""
Site content (key-value CMS), contact form submissions, and audit log models.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class SiteContent(Base, TimestampMixin):
    """
    Generic key-value store for configurable site content.
    Examples:
      key="institution_name"   value="[Institution Name]"
      key="institution_tagline" value="[Tagline]"
      key="about_history"      value="[History text]"
      key="principal_name"     value="[Principal Name]"
    """
    __tablename__ = "site_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="text"
    )  # text | html | json | image
    label: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)  # Human-readable label
    group: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)  # e.g. "homepage", "about"


class ContactSubmission(Base, TimestampMixin):
    __tablename__ = "contact_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv6 max


class AuditLog(Base, TimestampMixin):
    """
    Immutable record of admin actions.
    Never delete these records — archive only.
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    result: Mapped[str] = mapped_column(String(20), nullable=False, default="success")  # success | failure
