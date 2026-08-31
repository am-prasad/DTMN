"""
Activities API.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import CurrentUser, require_content_admin
from app.models.activity import Activity, ActivityCategory
from app.schemas.activity import ActivityCreate, ActivityListOut, ActivityOut, ActivityUpdate
from app.schemas.common import MessageResponse
from app.schemas.bulk import BulkActionRequest, BulkActionResponse
from app.services.audit_service import AuditService

router = APIRouter(tags=["Activities"])


@router.get("/activities", response_model=list[ActivityListOut])
async def list_activities(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[ActivityListOut]:
    q = (
        select(Activity)
        .options(selectinload(Activity.category), selectinload(Activity.images))
        .where(Activity.is_published == True, Activity.is_archived == False)
    )
    if category:
        q = q.join(ActivityCategory).where(ActivityCategory.slug == category)
    q = q.order_by(Activity.activity_date.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/activities/{slug}", response_model=ActivityOut)
async def get_activity(slug: str, db: AsyncSession = Depends(get_db)) -> ActivityOut:
    result = await db.execute(
        select(Activity)
        .options(selectinload(Activity.category), selectinload(Activity.images))
        .where(Activity.slug == slug, Activity.is_published == True, Activity.is_archived == False)
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found.")
    return activity


@router.get("/admin/activities", response_model=list[ActivityListOut], dependencies=[Depends(require_content_admin())])
async def admin_list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[ActivityListOut]:
    q = (
        select(Activity)
        .options(selectinload(Activity.category), selectinload(Activity.images))
        .where(Activity.is_archived == False)
        .order_by(Activity.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/admin/activities", response_model=ActivityOut, status_code=201, dependencies=[Depends(require_content_admin())])
async def create_activity(
    body: ActivityCreate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ActivityOut:
    slug = slugify(body.title)
    activity = Activity(**body.model_dump(), slug=slug)
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    await AuditService(db).log("ACTIVITY_CREATED", current_user, "activity", activity.id, request.client.host if request.client else None)
    result = await db.execute(
        select(Activity).options(selectinload(Activity.category), selectinload(Activity.images)).where(Activity.id == activity.id)
    )
    return result.scalar_one()


@router.patch("/admin/activities/{activity_id}", response_model=ActivityOut, dependencies=[Depends(require_content_admin())])
async def update_activity(
    activity_id: int,
    body: ActivityUpdate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ActivityOut:
    result = await db.execute(select(Activity).where(Activity.id == activity_id, Activity.is_archived == False))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(activity, k, v)
    await db.commit()
    await AuditService(db).log("ACTIVITY_UPDATED", current_user, "activity", activity_id, request.client.host if request.client else None)
    result = await db.execute(
        select(Activity).options(selectinload(Activity.category), selectinload(Activity.images)).where(Activity.id == activity_id)
    )
    return result.scalar_one()


@router.delete("/admin/activities/{activity_id}", response_model=MessageResponse, dependencies=[Depends(require_content_admin())])
async def delete_activity(
    activity_id: int,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found.")
    activity.is_archived = True
    await db.commit()
    await AuditService(db).log("ACTIVITY_ARCHIVED", current_user, "activity", activity_id, request.client.host if request.client else None)
    return MessageResponse(message="Activity archived.")


@router.post("/admin/activities/bulk", response_model=BulkActionResponse, dependencies=[Depends(require_content_admin())])
async def bulk_action_activities(
    body: BulkActionRequest,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> BulkActionResponse:
    """Bulk delete/publish/unpublish activities."""
    allowed = {"delete", "publish", "unpublish"}
    if body.action not in allowed:
        raise HTTPException(status_code=400, detail=f"Action must be one of: {', '.join(allowed)}")
    result = await db.execute(select(Activity).where(Activity.id.in_(body.ids)))
    activities = result.scalars().all()
    for act in activities:
        if body.action == "delete":
            act.is_archived = True
        elif body.action == "publish":
            act.is_published = True
        elif body.action == "unpublish":
            act.is_published = False
    await db.commit()
    ip = request.client.host if request.client else None
    await AuditService(db).log(f"ACTIVITY_BULK_{body.action.upper()}", current_user, "activity", None, ip, {"ids": body.ids})
    return BulkActionResponse(affected=len(activities), action=body.action, message=f"{len(activities)} activity(ies) updated.")

