"""
Models package — import all models here so Alembic can discover them.
"""
from app.models.user import User, UserRole
from app.models.event import Event, EventCategory, EventImage
from app.models.circular import Circular, CircularCategory
from app.models.activity import Activity, ActivityCategory, ActivityImage
from app.models.faculty import Faculty, Department, AcademicSectionSlug
from app.models.gallery import GalleryAlbum, GalleryImage
from app.models.facility import Facility
from app.models.academic_section import AcademicSection
from app.models.admission import AdmissionInfo, AdmissionEnquiry, EnquiryStatus
from app.models.content import SiteContent, ContactSubmission, AuditLog

__all__ = [
    "User", "UserRole",
    "Event", "EventCategory", "EventImage",
    "Circular", "CircularCategory",
    "Activity", "ActivityCategory", "ActivityImage",
    "Faculty", "Department", "AcademicSectionSlug",
    "GalleryAlbum", "GalleryImage",
    "Facility",
    "AcademicSection",
    "AdmissionInfo", "AdmissionEnquiry", "EnquiryStatus",
    "SiteContent", "ContactSubmission", "AuditLog",
]
