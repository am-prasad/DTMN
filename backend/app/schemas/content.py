"""
Pydantic schemas for gallery, facilities, academic sections, admissions, site content, contact.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.admission import EnquiryStatus


# ---------------------------------------------------------------------------
# Gallery
# ---------------------------------------------------------------------------
class GalleryImageOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    image_path: str
    caption: Optional[str]
    sort_order: int


class GalleryImageCreate(BaseModel):
    image_path: str
    caption: Optional[str] = None
    sort_order: int = 0


class GalleryAlbumOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    slug: str
    description: Optional[str]
    category: Optional[str]
    cover_image: Optional[str]
    is_published: bool
    images: list[GalleryImageOut] = []


class GalleryAlbumListOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    slug: str
    description: Optional[str]
    category: Optional[str]
    cover_image: Optional[str]
    is_published: bool
    image_count: int = 0


class GalleryAlbumCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[str] = Field(default=None, max_length=100)
    is_published: bool = False
    sort_order: int = 0


class GalleryAlbumUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=300)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[str] = Field(default=None, max_length=100)
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None
    sort_order: Optional[int] = None


# ---------------------------------------------------------------------------
# Facilities
# ---------------------------------------------------------------------------
class FacilityOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    icon: Optional[str]
    image: Optional[str]
    is_active: bool
    sort_order: int


class FacilityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[str] = Field(default=None, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=100)
    sort_order: int = 0


class FacilityUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[str] = Field(default=None, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


# ---------------------------------------------------------------------------
# Academic Sections
# ---------------------------------------------------------------------------
class AcademicSectionOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    slug: str
    name: str
    tagline: Optional[str]
    description: Optional[str]
    programs: Optional[str]
    curriculum: Optional[str]
    achievements: Optional[str]
    head_name: Optional[str]
    head_designation: Optional[str]
    head_message: Optional[str]
    head_photo: Optional[str]
    cover_image: Optional[str]


class AcademicSectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    tagline: Optional[str] = Field(default=None, max_length=400)
    description: Optional[str] = Field(default=None, max_length=20000)
    programs: Optional[str] = Field(default=None, max_length=20000)
    curriculum: Optional[str] = Field(default=None, max_length=20000)
    achievements: Optional[str] = Field(default=None, max_length=20000)
    head_name: Optional[str] = Field(default=None, max_length=255)
    head_designation: Optional[str] = Field(default=None, max_length=255)
    head_message: Optional[str] = Field(default=None, max_length=10000)


# ---------------------------------------------------------------------------
# Admissions
# ---------------------------------------------------------------------------
class AdmissionInfoOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    section_slug: str
    overview: Optional[str]
    eligibility: Optional[str]
    process: Optional[str]
    important_dates: Optional[str]
    documents_required: Optional[str]
    fee_info: Optional[str]
    faqs: Optional[str]
    contact_info: Optional[str]


class AdmissionInfoUpdate(BaseModel):
    overview: Optional[str] = Field(default=None, max_length=20000)
    eligibility: Optional[str] = Field(default=None, max_length=10000)
    process: Optional[str] = Field(default=None, max_length=10000)
    important_dates: Optional[str] = Field(default=None, max_length=5000)
    documents_required: Optional[str] = Field(default=None, max_length=5000)
    fee_info: Optional[str] = Field(default=None, max_length=5000)
    faqs: Optional[str] = Field(default=None, max_length=20000)
    contact_info: Optional[str] = Field(default=None, max_length=2000)


class AdmissionEnquiryCreate(BaseModel):
    student_name: str = Field(min_length=2, max_length=255)
    parent_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30, pattern=r"^[\d\+\-\(\)\s]+$")
    section: str = Field(min_length=2, max_length=50)
    message: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("section")
    @classmethod
    def validate_section(cls, v: str) -> str:
        allowed = {"nursery", "primary", "high-school", "college"}
        if v.lower() not in allowed:
            raise ValueError(f"Section must be one of: {', '.join(allowed)}")
        return v.lower()


class AdmissionEnquiryOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    student_name: str
    parent_name: str
    email: str
    phone: str
    section: str
    message: Optional[str]
    status: EnquiryStatus
    notes: Optional[str] = None
    created_at: datetime


class AdmissionEnquiryUpdate(BaseModel):
    status: Optional[EnquiryStatus] = None
    notes: Optional[str] = Field(default=None, max_length=5000)


# ---------------------------------------------------------------------------
# Site Content
# ---------------------------------------------------------------------------
class SiteContentOut(BaseModel):
    model_config = {"from_attributes": True}
    key: str
    value: Optional[str]
    content_type: str
    label: Optional[str]
    group: Optional[str]


class SiteContentUpdate(BaseModel):
    value: Optional[str] = Field(default=None, max_length=100000)


# ---------------------------------------------------------------------------
# Contact form
# ---------------------------------------------------------------------------
class ContactSubmissionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30, pattern=r"^[\d\+\-\(\)\s]*$")
    subject: str = Field(min_length=3, max_length=300)
    message: str = Field(min_length=10, max_length=5000)


class ContactSubmissionOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str
    is_read: bool
    created_at: datetime


class ContactSubmissionUpdate(BaseModel):
    is_read: Optional[bool] = None


# ---------------------------------------------------------------------------
# Admin User Management
# ---------------------------------------------------------------------------
class UserOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    mfa_enabled: bool


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=12, max_length=256)
    role: str = "content_admin"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"super_admin", "content_admin", "admission_admin"}
        if v not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    role: Optional[str] = None
    is_active: Optional[bool] = None
