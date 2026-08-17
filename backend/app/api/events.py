"""
Events API — public and admin endpoints.
"""
from __future__ import annotations

import secrets
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slugify import slugify
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import CurrentUser, require_content_admin
from app.models.event import Event, EventCategory
from app.schemas.event import EventCreate, EventListOut, EventOut, EventUpdate
from app.schemas.common import MessageResponse
from app.services.audit_service import AuditService

router = APIRouter(tags=["Events"])


def _event_query(published_only: bool = True):
    q = select(Event).options(selectinload(Event.category), selectinload(Event.images))
    if published_only:
        q = q.where(Event.is_published == True, Event.is_archived == False)
    return q


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------
@router.get("/events", response_model=list[EventListOut])
async def list_events(
    upcoming: bool = Query(False),
    past: bool = Query(False),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[EventListOut]:
    q = _event_query(published_only=True)
    today = date.today()
    if upcoming:
        q = q.where(Event.event_date >= today)
    elif past:
        q = q.where(Event.event_date < today)
    if category:
        q = q.join(EventCategory).where(EventCategory.slug == category)
    q = q.order_by(Event.event_date.asc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/events/{slug}", response_model=EventOut)
async def get_event(slug: str, db: AsyncSession = Depends(get_db)) -> EventOut:
    result = await db.execute(_event_query(published_only=True).where(Event.slug == slug))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return event


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------
@router.get("/admin/events", response_model=list[EventListOut], dependencies=[Depends(require_content_admin())])
async def admin_list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[EventListOut]:
    q = (
        select(Event)
        .options(selectinload(Event.category))
        .where(Event.is_archived == False)
        .order_by(Event.event_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/admin/events", response_model=EventOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_content_admin())])
async def create_event(
    body: EventCreate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> EventOut:
    slug = slugify(body.title)
    # Ensure unique slug
    existing = await db.execute(select(Event).where(Event.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{secrets.token_hex(4)}"
    event = Event(**body.model_dump(), slug=slug)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    await AuditService(db).log("EVENT_CREATED", current_user, "event", event.id, request.client.host if request.client else None)
    result = await db.execute(_event_query(published_only=False).where(Event.id == event.id))
    return result.scalar_one()


@router.patch("/admin/events/{event_id}", response_model=EventOut, dependencies=[Depends(require_content_admin())])
async def update_event(
    event_id: int,
    body: EventUpdate,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> EventOut:
    result = await db.execute(_event_query(published_only=False).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(event, k, v)
    await db.commit()
    await db.refresh(event)
    await AuditService(db).log("EVENT_UPDATED", current_user, "event", event_id, request.client.host if request.client else None)
    result = await db.execute(_event_query(published_only=False).where(Event.id == event_id))
    return result.scalar_one()


@router.delete("/admin/events/{event_id}", response_model=MessageResponse, dependencies=[Depends(require_content_admin())])
async def delete_event(
    event_id: int,
    request: Request,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    event.is_archived = True
    await db.commit()
    await AuditService(db).log("EVENT_ARCHIVED", current_user, "event", event_id, request.client.host if request.client else None)
    return MessageResponse(message="Event archived.")
