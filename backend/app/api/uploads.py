"""
Secure file upload API endpoint.
Used by admin to upload images (events, faculty, gallery, activities) and PDF documents.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.deps import require_content_admin
from app.services.storage_service import StorageService, get_storage

router = APIRouter(prefix="/admin/uploads", tags=["Uploads"])

ALLOWED_SUBDIRS = {"images", "documents", "faculty", "gallery", "activities", "sections"}


@router.post("/image", dependencies=[Depends(require_content_admin())])
async def upload_image(
    file: UploadFile = File(...),
    subdir: str = Form("images"),
    storage: StorageService = Depends(get_storage),
) -> dict:
    """
    Upload and validate an image.
    Returns the relative storage path for database storage.
    """
    if subdir not in ALLOWED_SUBDIRS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid subdir. Must be one of: {', '.join(ALLOWED_SUBDIRS)}")
    path = await storage.save_image(file, subdir=subdir)
    return {"path": path, "url": f"/uploads/{path}"}


@router.post("/document", dependencies=[Depends(require_content_admin())])
async def upload_document(
    file: UploadFile = File(...),
    storage: StorageService = Depends(get_storage),
) -> dict:
    """
    Upload and validate a PDF document.
    Returns the relative storage path.
    """
    path, original_name = await storage.save_document(file)
    return {"path": path, "filename": original_name, "url": f"/uploads/{path}"}
