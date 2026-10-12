"""
Gallery, Facilities, Academic Sections, Admissions, Site Content, Contact, Admin Users API.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.responses import FileResponse
from slugify import slugify
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import CurrentUser, require_admission_admin, require_content_admin, require_super_admin
from app.core.logging import log_security_event
from app.core.security import check_password_strength, hash_password
from app.models.academic_section import AcademicSection
from app.models.admission import AdmissionEnquiry, AdmissionInfo, EnquiryStatus
from app.models.content import AuditLog, ContactSubmission, SiteContent
from app.models.facility import Facility
from app.models.gallery import GalleryAlbum, GalleryImage
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.common import MessageResponse
from app.schemas.bulk import BulkActionRequest, BulkActionResponse
from app.schemas.content import (
    AcademicSectionOut,
    AcademicSectionUpdate,
    AdmissionEnquiryCreate,
    AdmissionEnquiryOut,
    AdmissionEnquiryUpdate,
    AdmissionInfoOut,
    AdmissionInfoUpdate,
    ContactSubmissionCreate,
    ContactSubmissionOut,
    ContactSubmissionUpdate,
    FacilityCreate,
    FacilityOut,
    FacilityUpdate,
    GalleryAlbumCreate,
    GalleryAlbumListOut,
    GalleryAlbumOut,
    GalleryAlbumUpdate,
    GalleryImageOut,
    SiteContentOut,
    SiteContentUpdate,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services.audit_service import AuditService
from app.services.storage_service import StorageService, get_storage

router = APIRouter(tags=["Content"])


# ===========================================================================
# Gallery
# ===========================================================================
@router.get("/gallery", response_model=list[GalleryAlbumListOut])
async def list_albums(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[GalleryAlbumListOut]:
    q = select(GalleryAlbum).where(GalleryAlbum.is_published == True, GalleryAlbum.is_archived == False)
    if category:
        q = q.where(GalleryAlbum.category == category)
    q = q.order_by(GalleryAlbum.sort_order.asc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    albums = result.scalars().all()
    # Get image counts
    out = []
    for album in albums:
        count_result = await db.execute(select(func.count()).where(GalleryImage.album_id == album.id))
        count = count_result.scalar() or 0
        out.append(GalleryAlbumListOut(
            id=album.id, title=album.title, slug=album.slug,
            description=album.description, category=album.category,
            cover_image=album.cover_image, is_published=album.is_published,
            image_count=count,
        ))
    return out


@router.get("/gallery/{slug}", response_model=GalleryAlbumOut)
async def get_album(slug: str, db: AsyncSession = Depends(get_db)) -> GalleryAlbumOut:
    result = await db.execute(
        select(GalleryAlbum)
        .options(selectinload(GalleryAlbum.images))
        .where(GalleryAlbum.slug == slug, GalleryAlbum.is_published == True, GalleryAlbum.is_archived == False)
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found.")
    return album


@router.get("/admin/gallery", response_model=list[GalleryAlbumListOut], dependencies=[Depends(require_content_admin())])
async def admin_list_albums(db: AsyncSession = Depends(get_db)) -> list[GalleryAlbumListOut]:
    result = await db.execute(
        select(GalleryAlbum).where(GalleryAlbum.is_archived == False).order_by(GalleryAlbum.sort_order.asc())
    )
    albums = result.scalars().all()
    out = []
    for album in albums:
        count_result = await db.execute(select(func.count()).where(GalleryImage.album_id == album.id))
        count = count_result.scalar() or 0
        out.append(GalleryAlbumListOut(
            id=album.id, title=album.title, slug=album.slug,
            description=album.description, category=album.category,
            cover_image=album.cover_image, is_published=album.is_published,
            image_count=count,
        ))
    return out


@router.post("/admin/gallery", response_model=GalleryAlbumOut, status_code=201, dependencies=[Depends(require_content_admin())])
async def create_album(body: GalleryAlbumCreate, db: AsyncSession = Depends(get_db)) -> GalleryAlbumOut:
    slug = slugify(body.title)
    album = GalleryAlbum(**body.model_dump(), slug=slug)
    db.add(album)
    await db.commit()
    await db.refresh(album)
    result = await db.execute(select(GalleryAlbum).options(selectinload(GalleryAlbum.images)).where(GalleryAlbum.id == album.id))
    return result.scalar_one()


@router.patch("/admin/gallery/{album_id}", response_model=GalleryAlbumOut, dependencies=[Depends(require_content_admin())])
async def update_album(album_id: int, body: GalleryAlbumUpdate, db: AsyncSession = Depends(get_db)) -> GalleryAlbumOut:
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id, GalleryAlbum.is_archived == False))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(album, k, v)
    await db.commit()
    result = await db.execute(select(GalleryAlbum).options(selectinload(GalleryAlbum.images)).where(GalleryAlbum.id == album_id))
    return result.scalar_one()


@router.get("/admin/gallery/{album_id}", response_model=GalleryAlbumOut, dependencies=[Depends(require_content_admin())])
async def admin_get_album(album_id: int, db: AsyncSession = Depends(get_db)) -> GalleryAlbumOut:
    result = await db.execute(
        select(GalleryAlbum).options(selectinload(GalleryAlbum.images)).where(GalleryAlbum.id == album_id)
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found.")
    return album


@router.delete("/admin/gallery/{album_id}", response_model=dict, dependencies=[Depends(require_content_admin())])
async def delete_album(
    album_id: int,
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
) -> dict:
    result = await db.execute(
        select(GalleryAlbum).options(selectinload(GalleryAlbum.images)).where(GalleryAlbum.id == album_id)
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found.")
    for img in album.images:
        try:
            storage.delete_file(img.image_path)
        except Exception:
            pass
    await db.delete(album)
    await db.commit()
    return {"message": "Gallery album deleted successfully."}


@router.post("/admin/gallery/{album_id}/images", response_model=GalleryImageOut, dependencies=[Depends(require_content_admin())])
async def add_album_image(
    album_id: int,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    storage: StorageService = Depends(get_storage),
    db: AsyncSession = Depends(get_db),
) -> GalleryImageOut:
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found.")

    path = await storage.save_image(file, subdir="gallery")

    count_res = await db.execute(select(func.count()).where(GalleryImage.album_id == album_id))
    current_count = count_res.scalar() or 0

    image = GalleryImage(album_id=album.id, image_path=path, caption=caption, sort_order=current_count)
    db.add(image)

    # Set as cover image if album doesn't have one
    if not album.cover_image:
        album.cover_image = path

    await db.commit()
    await db.refresh(image)
    return image


@router.delete("/admin/gallery/images/{image_id}", response_model=dict, dependencies=[Depends(require_content_admin())])
async def delete_album_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
) -> dict:
    result = await db.execute(select(GalleryImage).where(GalleryImage.id == image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found.")
    try:
        storage.delete_file(img.image_path)
    except Exception:
        pass
    await db.delete(img)
    await db.commit()
    return {"message": "Image deleted successfully."}


# ===========================================================================
# Facilities
# ===========================================================================
@router.get("/facilities", response_model=list[FacilityOut])
async def list_facilities(db: AsyncSession = Depends(get_db)) -> list[FacilityOut]:
    result = await db.execute(
        select(Facility).where(Facility.is_active == True).order_by(Facility.sort_order.asc())
    )
    return list(result.scalars().all())


@router.get("/admin/facilities", response_model=list[FacilityOut], dependencies=[Depends(require_content_admin())])
async def admin_list_facilities(db: AsyncSession = Depends(get_db)) -> list[FacilityOut]:
    result = await db.execute(select(Facility).order_by(Facility.sort_order.asc(), Facility.id.asc()))
    return list(result.scalars().all())


@router.post("/admin/facilities", response_model=FacilityOut, status_code=201, dependencies=[Depends(require_content_admin())])
async def create_facility(body: FacilityCreate, db: AsyncSession = Depends(get_db)) -> FacilityOut:
    facility = Facility(**body.model_dump())
    db.add(facility)
    await db.commit()
    await db.refresh(facility)
    return facility


@router.patch("/admin/facilities/{facility_id}", response_model=FacilityOut, dependencies=[Depends(require_content_admin())])
async def update_facility(facility_id: int, body: FacilityUpdate, db: AsyncSession = Depends(get_db)) -> FacilityOut:
    result = await db.execute(select(Facility).where(Facility.id == facility_id))
    facility = result.scalar_one_or_none()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(facility, k, v)
    await db.commit()
    await db.refresh(facility)
    return facility


@router.delete("/admin/facilities/{facility_id}", response_model=MessageResponse, dependencies=[Depends(require_content_admin())])
async def delete_facility(facility_id: int, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    result = await db.execute(select(Facility).where(Facility.id == facility_id))
    facility = result.scalar_one_or_none()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found.")
    facility.is_active = False
    await db.commit()
    return MessageResponse(message="Facility removed.")


# ===========================================================================
# Academic Sections
# ===========================================================================
@router.get("/academic-sections", response_model=list[AcademicSectionOut])
async def list_sections(db: AsyncSession = Depends(get_db)) -> list[AcademicSectionOut]:
    result = await db.execute(select(AcademicSection).where(AcademicSection.is_active == True))
    return list(result.scalars().all())


@router.get("/academic-sections/{slug}", response_model=AcademicSectionOut)
async def get_section(slug: str, db: AsyncSession = Depends(get_db)) -> AcademicSectionOut:
    result = await db.execute(select(AcademicSection).where(AcademicSection.slug == slug, AcademicSection.is_active == True))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found.")
    return section


@router.patch("/admin/academic-sections/{slug}", response_model=AcademicSectionOut, dependencies=[Depends(require_content_admin())])
async def update_section(slug: str, body: AcademicSectionUpdate, db: AsyncSession = Depends(get_db)) -> AcademicSectionOut:
    result = await db.execute(select(AcademicSection).where(AcademicSection.slug == slug))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(section, k, v)
    await db.commit()
    await db.refresh(section)
    return section


# ===========================================================================
# Admissions
# ===========================================================================
@router.get("/admissions/{section_slug}", response_model=AdmissionInfoOut)
async def get_admission_info(section_slug: str, db: AsyncSession = Depends(get_db)) -> AdmissionInfoOut:
    result = await db.execute(select(AdmissionInfo).where(AdmissionInfo.section_slug == section_slug))
    info = result.scalar_one_or_none()
    if not info:
        raise HTTPException(status_code=404, detail="Admission information not found.")
    return info


@router.patch("/admin/admissions/{section_slug}", response_model=AdmissionInfoOut, dependencies=[Depends(require_admission_admin())])
async def update_admission_info(section_slug: str, body: AdmissionInfoUpdate, db: AsyncSession = Depends(get_db)) -> AdmissionInfoOut:
    result = await db.execute(select(AdmissionInfo).where(AdmissionInfo.section_slug == section_slug))
    info = result.scalar_one_or_none()
    if not info:
        info = AdmissionInfo(section_slug=section_slug)
        db.add(info)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(info, k, v)
    await db.commit()
    await db.refresh(info)
    return info


@router.post("/admissions/enquiry", response_model=MessageResponse, status_code=201)
async def submit_enquiry(body: AdmissionEnquiryCreate, request: Request, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    enquiry = AdmissionEnquiry(**body.model_dump())
    db.add(enquiry)
    await db.commit()
    return MessageResponse(message="Your enquiry has been submitted. We will contact you shortly.")


@router.get("/admin/admissions/enquiries", response_model=list[AdmissionEnquiryOut], dependencies=[Depends(require_admission_admin())])
async def list_enquiries(
    status_filter: Optional[EnquiryStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[AdmissionEnquiryOut]:
    q = select(AdmissionEnquiry)
    if status_filter:
        q = q.where(AdmissionEnquiry.status == status_filter)
    q = q.order_by(AdmissionEnquiry.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.patch("/admin/admissions/enquiries/{enquiry_id}", response_model=AdmissionEnquiryOut, dependencies=[Depends(require_admission_admin())])
async def update_enquiry(
    enquiry_id: int,
    body: AdmissionEnquiryUpdate,
    db: AsyncSession = Depends(get_db),
) -> AdmissionEnquiryOut:
    result = await db.execute(select(AdmissionEnquiry).where(AdmissionEnquiry.id == enquiry_id))
    enquiry = result.scalar_one_or_none()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(enquiry, k, v)
    await db.commit()
    await db.refresh(enquiry)
    return enquiry


# ===========================================================================
# Site Content
# ===========================================================================
@router.get("/content", response_model=list[SiteContentOut])
async def list_content(
    response: Response,
    group: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[SiteContentOut]:
    response.headers["Cache-Control"] = "no-store"
    q = select(SiteContent)
    if group:
        q = q.where(SiteContent.group == group)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/content/{key}", response_model=SiteContentOut)
async def get_content(response: Response, key: str, db: AsyncSession = Depends(get_db)) -> SiteContentOut:
    response.headers["Cache-Control"] = "no-store"
    result = await db.execute(select(SiteContent).where(SiteContent.key == key))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Content key not found.")
    return item


@router.patch("/admin/content/{key}", response_model=SiteContentOut, dependencies=[Depends(require_content_admin())])
async def update_content(key: str, body: SiteContentUpdate, db: AsyncSession = Depends(get_db)) -> SiteContentOut:
    result = await db.execute(select(SiteContent).where(SiteContent.key == key))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Content key not found.")
    if body.value is not None:
        import bleach
        EXTRA_TAGS = {
            "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li", "dl", "dt", "dd",
            "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
            "blockquote", "code", "pre",
            "a", "span", "div",
            "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
            "img", "figure", "figcaption", "hr",
        }
        allowed_tags = set(bleach.ALLOWED_TAGS) | EXTRA_TAGS
        allowed_attrs = {
            "a": ["href", "title", "target", "rel"],
            "img": ["src", "alt", "title", "width", "height"],
            "td": ["colspan", "rowspan"],
            "th": ["colspan", "rowspan"],
            "*": ["class", "id"],
        }
        if item.content_type == "html":
            item.value = bleach.clean(body.value, tags=allowed_tags, attributes=allowed_attrs, strip=True)
        else:
            item.value = body.value
    await db.commit()
    await db.refresh(item)
    return item


# ===========================================================================
# Contact form & Inbox
# ===========================================================================
@router.post("/contact", response_model=MessageResponse, status_code=201)
async def submit_contact(body: ContactSubmissionCreate, request: Request, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    ip = request.client.host if request.client else None
    submission = ContactSubmission(
        name=body.name, email=str(body.email), phone=body.phone,
        subject=body.subject, message=body.message, ip_address=ip,
    )
    db.add(submission)
    await db.commit()
    return MessageResponse(message="Thank you for your message. We will respond within 2 business days.")


@router.get("/admin/contact-submissions", response_model=list[ContactSubmissionOut], dependencies=[Depends(require_content_admin())])
async def list_contact_submissions(
    is_read: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[ContactSubmissionOut]:
    q = select(ContactSubmission)
    if is_read is not None:
        q = q.where(ContactSubmission.is_read == is_read)
    q = q.order_by(ContactSubmission.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.patch("/admin/contact-submissions/{submission_id}", response_model=ContactSubmissionOut, dependencies=[Depends(require_content_admin())])
async def update_contact_submission(
    submission_id: int,
    body: ContactSubmissionUpdate,
    db: AsyncSession = Depends(get_db),
) -> ContactSubmissionOut:
    result = await db.execute(select(ContactSubmission).where(ContactSubmission.id == submission_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Contact submission not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(sub, k, v)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/admin/contact-submissions/{submission_id}", response_model=MessageResponse, dependencies=[Depends(require_content_admin())])
async def delete_contact_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(select(ContactSubmission).where(ContactSubmission.id == submission_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Contact submission not found.")
    await db.delete(sub)
    await db.commit()
    return MessageResponse(message="Contact submission deleted.")


# ===========================================================================
# Admin stats (dashboard v2)
# ===========================================================================
@router.get("/admin/stats")
async def get_stats(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo
    from fastapi.responses import JSONResponse
    from app.models.event import Event
    from app.models.circular import Circular
    from app.models.activity import Activity
    from app.models.faculty import Faculty

    def count_if(cond):
        return func.coalesce(func.sum(case((cond, 1), else_=0)), 0)

    # Use Asia/Kolkata for school in India
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    next_7d = today + timedelta(days=7)

    # 1. Events single query
    ev_row = (await db.execute(select(
        count_if(Event.is_archived.is_(False)).label("total"),
        count_if(Event.is_archived.is_(False) & Event.is_published.is_(False)).label("drafts"),
        count_if(Event.is_archived.is_(False) & Event.is_published.is_(True) & (Event.event_date >= today)).label("upcoming"),
        count_if(Event.is_archived.is_(False) & Event.is_published.is_(True) & (Event.event_date < today)).label("past"),
    ))).one()

    # 2. Circulars single query
    circ_row = (await db.execute(select(
        count_if(Circular.is_archived.is_(False) & Circular.is_published.is_(True)).label("published"),
        count_if(Circular.is_archived.is_(False) & Circular.is_published.is_(False)).label("drafts"),
        count_if(
            Circular.is_archived.is_(False)
            & Circular.is_published.is_(True)
            & (Circular.expires_at.is_not(None))
            & (Circular.expires_at >= today)
            & (Circular.expires_at <= next_7d)
        ).label("expiring_7d"),
    ))).one()

    # 3. Activities single query
    act_row = (await db.execute(select(
        count_if(Activity.is_archived.is_(False) & Activity.is_published.is_(True)).label("published"),
        count_if(Activity.is_archived.is_(False) & Activity.is_published.is_(False)).label("drafts"),
    ))).one()

    # 4. Faculty single query
    fac_row = (await db.execute(select(
        count_if(Faculty.is_active.is_(True)).label("active"),
        count_if(Faculty.is_active.is_(False)).label("inactive"),
    ))).one()

    # 5. Gallery albums
    gal_res = await db.execute(
        select(GalleryAlbum).options(selectinload(GalleryAlbum.images)).where(GalleryAlbum.is_archived.is_(False))
    )
    albums = list(gal_res.scalars().all())
    gallery_published = sum(1 for a in albums if a.is_published)
    empty_albums = sum(1 for a in albums if a.is_published and len(a.images) == 0)

    # 6. Admission enquiries single query
    enq_row = (await db.execute(select(
        count_if(AdmissionEnquiry.status == EnquiryStatus.NEW).label("new"),
        func.count(AdmissionEnquiry.id).label("total"),
    ))).one()

    # 7. Contact submissions single query
    cnt_row = (await db.execute(select(
        count_if(ContactSubmission.is_read.is_(False)).label("unread"),
    ))).one()

    # 8. Needs attention panel items
    attention = []
    # New enquiries
    new_enq_rows = (await db.execute(
        select(AdmissionEnquiry.id, AdmissionEnquiry.student_name)
        .where(AdmissionEnquiry.status == EnquiryStatus.NEW)
        .order_by(AdmissionEnquiry.created_at.desc())
        .limit(5)
    )).all()
    for e in new_enq_rows:
        attention.append({
            "type": "enquiry",
            "resource": "admission",
            "id": e.id,
            "label": f"New enquiry from {e.student_name}",
        })

    # Unread contact submissions
    unread_cnt_rows = (await db.execute(
        select(ContactSubmission.id, ContactSubmission.name, ContactSubmission.subject)
        .where(ContactSubmission.is_read.is_(False))
        .order_by(ContactSubmission.created_at.desc())
        .limit(5)
    )).all()
    for c in unread_cnt_rows:
        attention.append({
            "type": "contact",
            "resource": "contact",
            "id": c.id,
            "label": f"Unread message from {c.name}: {c.subject}",
        })

    # Expiring circulars
    expiring_circ_rows = (await db.execute(
        select(Circular.id, Circular.title)
        .where(
            Circular.is_archived.is_(False),
            Circular.is_published.is_(True),
            Circular.expires_at.is_not(None),
            Circular.expires_at >= today,
            Circular.expires_at <= next_7d,
        )
        .limit(5)
    )).all()
    for c in expiring_circ_rows:
        attention.append({
            "type": "circular",
            "resource": "circular",
            "id": c.id,
            "label": f"Expiring circular: {c.title}",
        })

    # Empty published albums
    for a in albums:
        if a.is_published and len(a.images) == 0:
            attention.append({
                "type": "gallery",
                "resource": "gallery",
                "id": a.id,
                "label": f"Published album with 0 photos: {a.title}",
            })

    # 9. Recent activity feed from AuditLog
    recent_audit = (await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10)
    )).scalars().all()
    recent = [
        {
            "action": a.action,
            "user": a.user_email or "System",
            "resource": a.resource_type or "",
            "at": a.created_at.isoformat() if a.created_at else "",
        }
        for a in recent_audit
    ]

    return JSONResponse(
        content={
            # Backward-compatible top-level keys
            "total_events": int(ev_row.total or 0),
            "upcoming_events": int(ev_row.upcoming or 0),
            "published_circulars": int(circ_row.published or 0),
            "total_activities": int(act_row.published or 0) + int(act_row.drafts or 0),
            "total_faculty": int(fac_row.active or 0),
            "gallery_albums": len(albums),
            "admission_enquiries": int(enq_row.total or 0),
            # V2 structured breakdown
            "events": {
                "total": int(ev_row.total or 0),
                "drafts": int(ev_row.drafts or 0),
                "upcoming": int(ev_row.upcoming or 0),
                "past": int(ev_row.past or 0),
            },
            "circulars": {
                "published": int(circ_row.published or 0),
                "drafts": int(circ_row.drafts or 0),
                "expiring_7d": int(circ_row.expiring_7d or 0),
            },
            "activities": {
                "published": int(act_row.published or 0),
                "drafts": int(act_row.drafts or 0),
            },
            "faculty": {
                "active": int(fac_row.active or 0),
                "inactive": int(fac_row.inactive or 0),
            },
            "gallery": {
                "published": gallery_published,
                "empty_albums": empty_albums,
            },
            "enquiries": {
                "new": int(enq_row.new or 0),
                "total": int(enq_row.total or 0),
            },
            "contact": {
                "unread": int(cnt_row.unread or 0),
            },
            "attention": attention,
            "recent": recent,
        },
        headers={"Cache-Control": "no-store"},
    )


# ===========================================================================
# Admin User Management (Super Admin only)
# ===========================================================================
@router.get("/admin/users", response_model=list[UserOut], dependencies=[Depends(require_super_admin())])
async def list_users(db: AsyncSession = Depends(get_db)) -> list[UserOut]:
    repo = UserRepository(db)
    return await repo.list_all()


@router.post("/admin/users", response_model=UserOut, status_code=201, dependencies=[Depends(require_super_admin())])
async def create_user(
    body: UserCreate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    errors = check_password_strength(body.password)
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))
    repo = UserRepository(db)
    existing = await repo.get_by_email(body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    user = await repo.create(
        email=str(body.email).lower().strip(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=UserRole(body.role),
        must_change_password=True,
    )
    await AuditService(db).log("ADMIN_CREATED", current_user, "user", user.id, request.client.host if request.client else None, {"new_role": body.role})
    log_security_event("ADMIN_CREATED", user_id=str(current_user.id), new_user_email=str(body.email))
    return user


@router.patch("/admin/users/{user_id}", response_model=UserOut, dependencies=[Depends(require_super_admin())])
async def update_user(
    user_id: int,
    body: UserUpdate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.role:
        updates: dict = {k: v for k, v in body.model_dump(exclude_none=True).items()}
        updates["role"] = UserRole(body.role)
    else:
        updates = body.model_dump(exclude_none=True)
    updated = await repo.update(user, **updates)
    await AuditService(db).log("USER_UPDATED", current_user, "user", user_id, request.client.host if request.client else None)
    return updated


# ===========================================================================
# Audit Logs (Super Admin only)
# ===========================================================================
@router.get("/admin/audit-logs", dependencies=[Depends(require_super_admin())])
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "user_email": l.user_email,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "ip_address": l.ip_address,
            "result": l.result,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]


# ===========================================================================
# Bulk Gallery Actions
# ===========================================================================
@router.post("/admin/gallery/bulk", response_model=BulkActionResponse, dependencies=[Depends(require_content_admin())])
async def bulk_action_gallery(
    body: BulkActionRequest,
    db: AsyncSession = Depends(get_db),
) -> BulkActionResponse:
    """Bulk delete/publish/unpublish gallery albums."""
    allowed = {"delete", "publish", "unpublish"}
    if body.action not in allowed:
        raise HTTPException(status_code=400, detail=f"Action must be one of: {', '.join(allowed)}")
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id.in_(body.ids)))
    albums = result.scalars().all()
    for album in albums:
        if body.action == "delete":
            album.is_archived = True
        elif body.action == "publish":
            album.is_published = True
        elif body.action == "unpublish":
            album.is_published = False
    await db.commit()
    return BulkActionResponse(affected=len(albums), action=body.action, message=f"{len(albums)} album(s) updated.")
