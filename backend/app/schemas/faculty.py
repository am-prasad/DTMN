"""
Pydantic schemas for faculty.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.faculty import AcademicSectionSlug


class DepartmentOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    section: AcademicSectionSlug


class FacultyOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    designation: str
    qualification: Optional[str]
    experience_years: Optional[int]
    bio: Optional[str]
    photo: Optional[str]
    institutional_email: Optional[str]
    is_active: bool
    section: AcademicSectionSlug
    sort_order: int
    department: Optional[DepartmentOut]


class FacultyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    designation: str = Field(min_length=2, max_length=255)
    qualification: Optional[str] = Field(default=None, max_length=500)
    experience_years: Optional[int] = Field(default=None, ge=0, le=60)
    bio: Optional[str] = Field(default=None, max_length=5000)
    institutional_email: Optional[EmailStr] = None
    section: AcademicSectionSlug
    department_id: Optional[int] = None
    sort_order: int = 0
    is_active: bool = True


class FacultyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    designation: Optional[str] = Field(default=None, min_length=2, max_length=255)
    qualification: Optional[str] = Field(default=None, max_length=500)
    experience_years: Optional[int] = Field(default=None, ge=0, le=60)
    bio: Optional[str] = Field(default=None, max_length=5000)
    institutional_email: Optional[EmailStr] = None
    section: Optional[AcademicSectionSlug] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
