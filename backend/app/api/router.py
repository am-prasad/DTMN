"""
Central API router — assembles all sub-routers.
"""
from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.events import router as events_router
from app.api.circulars import router as circulars_router
from app.api.activities import router as activities_router
from app.api.faculty import router as faculty_router
from app.api.content import router as content_router
from app.api.uploads import router as uploads_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(events_router)
api_router.include_router(circulars_router)
api_router.include_router(activities_router)
api_router.include_router(faculty_router)
api_router.include_router(content_router)
api_router.include_router(uploads_router)
