"""
Circulars API.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import FileResponse
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, require_content_admin
from app.models.circular import Circular, CircularCategory
from app.schemas.circular import CircularCreate, CircularOut, CircularUpdate
from app.schemas.common import MessageResponse
from app.schemas.bulk import BulkActionRequest, BulkActionResponse
from app.services.audit_service import AuditService
from app.services.storage_service import get_storage

router = APIRouter(tags=["Circulars"])


@router.get("/circulars", response_model=list[CircularOut])
async def list_circulars(
    category: Optional[CircularCategory] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[CircularOut]:
    from datetime import date
    q = select(Circular).where(Circular.is_published == True, Circular.is_archived == False)
    today = date.today()
    q = q.where((Circular.expires_at == None) | (Circular.expires_at >= today))
    if category:
        q = q.where(Circular.category == category)
    if search:
        term = f"%{search}%"
        q = q.where(Circular.title.ilike(term))
    q = q.order_by(Circular.published_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/circulars/{slug}", response_model=CircularOut)
async def get_circular(slug: str, db: AsyncSession = Depends(get_db)) -> CircularOut:
    result = await db.execute(
        select(Circular).where(Circular.slug == slug, Circular.is_published == True, Circular.is_archived == False)
    )
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found.")
    return circular


@router.get("/circulars/{circular_id}/download")
async def download_circular(circular_id: int, db: AsyncSession = Depends(get_db)) -> FileResponse:
    """Download the PDF attachment for a circular."""
    result = await db.execute(
        select(Circular).where(Circular.id == circular_id, Circular.is_published == True, Circular.is_archived == False)
    )
    circular = result.scalar_one_or_none()
    if not circular or not circular.attachment_path:
        raise HTTPException(status_code=404, detail="Attachment not found.")
    storage = get_storage()
    abs_path = storage.get_absolute_path(circular.attachment_path)
    if not abs_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(
        path=str(abs_path),
        filename=circular.attachment_filename or "circular.pdf",
        media_type="application/pdf",
    )


@router.get("/admin/circulars", response_model=list[CircularOut], dependencies=[Depends(require_content_admin())])
async def admin_list_circulars(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[CircularOut]:
    q = select(Circular).where(Circular.is_archived == False).order_by(Circular.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/admin/circulars", response_model=CircularOut, status_code=201, dependencies=[Depends(require_content_admin())])
async def create_circular(
    body: CircularCreate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CircularOut:
    slug = slugify(body.title)
    circular = Circular(**body.model_dump(), slug=slug)
    db.add(circular)
    await db.commit()
    await db.refresh(circular)
    await AuditService(db).log("CIRCULAR_CREATED", current_user, "circular", circular.id, request.client.host if request.client else None)
    return circular


@router.patch("/admin/circulars/{circular_id}", response_model=CircularOut, dependencies=[Depends(require_content_admin())])
async def update_circular(
    circular_id: int,
    body: CircularUpdate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CircularOut:
    result = await db.execute(select(Circular).where(Circular.id == circular_id, Circular.is_archived == False))
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(circular, k, v)
    await db.commit()
    await db.refresh(circular)
    await AuditService(db).log("CIRCULAR_UPDATED", current_user, "circular", circular_id, request.client.host if request.client else None)
    return circular


@router.delete("/admin/circulars/{circular_id}", response_model=MessageResponse, dependencies=[Depends(require_content_admin())])
async def delete_circular(
    circular_id: int,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found.")
    circular.is_archived = True
    await db.commit()
    await AuditService(db).log("CIRCULAR_ARCHIVED", current_user, "circular", circular_id, request.client.host if request.client else None)
    return MessageResponse(message="Circular archived.")


@router.post("/admin/circulars/bulk", response_model=BulkActionResponse, dependencies=[Depends(require_content_admin())])
async def bulk_action_circulars(
    body: BulkActionRequest,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> BulkActionResponse:
    """Bulk delete/publish/unpublish circulars."""
    allowed = {"delete", "publish", "unpublish"}
    if body.action not in allowed:
        raise HTTPException(status_code=400, detail=f"Action must be one of: {', '.join(allowed)}")
    result = await db.execute(select(Circular).where(Circular.id.in_(body.ids)))
    circulars = result.scalars().all()
    for circ in circulars:
        if body.action == "delete":
            circ.is_archived = True
        elif body.action == "publish":
            circ.is_published = True
        elif body.action == "unpublish":
            circ.is_published = False
    await db.commit()
    ip = request.client.host if request.client else None
    await AuditService(db).log(f"CIRCULAR_BULK_{body.action.upper()}", current_user, "circular", None, ip, {"ids": body.ids})
    return BulkActionResponse(affected=len(circulars), action=body.action, message=f"{len(circulars)} circular(s) updated.")

