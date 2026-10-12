"""
Faculty API.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import require_content_admin
from app.models.faculty import AcademicSectionSlug, Department, Faculty
from app.schemas.faculty import DepartmentCreate, DepartmentOut, FacultyCreate, FacultyOut, FacultyUpdate
from app.schemas.bulk import BulkActionRequest, BulkActionResponse

router = APIRouter(tags=["Faculty"])


@router.get("/faculty", response_model=list[FacultyOut])
async def list_faculty(
    section: Optional[AcademicSectionSlug] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[FacultyOut]:
    q = (
        select(Faculty)
        .options(selectinload(Faculty.department))
        .where(Faculty.is_active == True)
    )
    if section:
        q = q.where(Faculty.section == section)
    q = q.order_by(Faculty.sort_order.asc(), Faculty.name.asc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/faculty/{faculty_id}", response_model=FacultyOut)
async def get_faculty(faculty_id: int, db: AsyncSession = Depends(get_db)) -> FacultyOut:
    result = await db.execute(
        select(Faculty).options(selectinload(Faculty.department)).where(Faculty.id == faculty_id, Faculty.is_active == True)
    )
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found.")
    return faculty


@router.get("/admin/faculty", response_model=list[FacultyOut], dependencies=[Depends(require_content_admin())])
async def admin_list_faculty(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[FacultyOut]:
    q = select(Faculty).options(selectinload(Faculty.department)).order_by(Faculty.name.asc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/admin/faculty", response_model=FacultyOut, status_code=201, dependencies=[Depends(require_content_admin())])
async def create_faculty(body: FacultyCreate, db: AsyncSession = Depends(get_db)) -> FacultyOut:
    faculty = Faculty(**body.model_dump())
    db.add(faculty)
    await db.commit()
    await db.refresh(faculty)
    result = await db.execute(select(Faculty).options(selectinload(Faculty.department)).where(Faculty.id == faculty.id))
    return result.scalar_one()


@router.patch("/admin/faculty/{faculty_id}", response_model=FacultyOut, dependencies=[Depends(require_content_admin())])
async def update_faculty(faculty_id: int, body: FacultyUpdate, db: AsyncSession = Depends(get_db)) -> FacultyOut:
    result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(faculty, k, v)
    await db.commit()
    result = await db.execute(select(Faculty).options(selectinload(Faculty.department)).where(Faculty.id == faculty_id))
    return result.scalar_one()


@router.delete("/admin/faculty/{faculty_id}", response_model=dict, dependencies=[Depends(require_content_admin())])
async def delete_faculty(faculty_id: int, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    await db.delete(faculty)
    await db.commit()
    return {"message": "Faculty member deleted successfully."}


@router.post("/admin/faculty/bulk", response_model=BulkActionResponse, dependencies=[Depends(require_content_admin())])
async def bulk_action_faculty(
    body: BulkActionRequest,
    db: AsyncSession = Depends(get_db),
) -> BulkActionResponse:
    """Bulk activate/deactivate/delete faculty members."""
    allowed = {"activate", "deactivate", "delete"}
    if body.action not in allowed:
        raise HTTPException(status_code=400, detail=f"Action must be one of: {', '.join(allowed)}")
    result = await db.execute(select(Faculty).where(Faculty.id.in_(body.ids)))
    members = result.scalars().all()
    for member in members:
        if body.action == "activate":
            member.is_active = True
        elif body.action == "deactivate":
            member.is_active = False
        elif body.action == "delete":
            await db.delete(member)
    await db.commit()
    return BulkActionResponse(affected=len(members), action=body.action, message=f"{len(members)} faculty member(s) updated.")


# ---------------------------------------------------------------------------
# Departments CRUD
# ---------------------------------------------------------------------------
@router.get("/departments", response_model=list[DepartmentOut])
async def list_departments(
    section: Optional[AcademicSectionSlug] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[DepartmentOut]:
    q = select(Department)
    if section:
        q = q.where(Department.section == section)
    q = q.order_by(Department.name.asc())
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/admin/departments", response_model=DepartmentOut, status_code=201, dependencies=[Depends(require_content_admin())])
async def create_department(body: DepartmentCreate, db: AsyncSession = Depends(get_db)) -> DepartmentOut:
    dept = Department(name=body.name, section=body.section)
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.delete("/admin/departments/{department_id}", dependencies=[Depends(require_content_admin())])
async def delete_department(department_id: int, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    await db.delete(dept)
    await db.commit()
    return {"message": "Department deleted."}

