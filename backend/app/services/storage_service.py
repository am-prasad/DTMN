"""
Secure file storage service.

Security requirements implemented:
- Server-generated UUIDs for filenames (no user-controlled paths)
- MIME type validation via python-magic (file signature)
- Extension validation against allowlist
- Image re-encoding via Pillow (strips metadata, prevents polyglot attacks)
- PDF magic-byte validation
- File size enforcement
- Storage only in configured UPLOAD_DIR (never executable directories)
- Path traversal prevention via os.path.realpath

IMPORTANT: This service uses local filesystem storage.
For production, swap the _save() method with S3/R2/MinIO client calls.
"""
from __future__ import annotations

import io
import os
import uuid
from pathlib import Path
from typing import Literal

from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.core.config import get_settings
from app.core.logging import get_logger

try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False

settings = get_settings()
logger = get_logger(__name__)

# Allowed MIME types and extensions
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

ALLOWED_DOCUMENT_MIMES = {"application/pdf"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf"}

# Max image dimensions (to prevent decompression bomb)
MAX_IMAGE_DIMENSION = 6000


class StorageService:
    def __init__(self) -> None:
        self.upload_dir = Path(settings.UPLOAD_DIR).resolve()
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        # Ensure sub-directories exist
        for sub in ["images", "documents", "faculty", "gallery"]:
            (self.upload_dir / sub).mkdir(exist_ok=True)

    def _safe_path(self, subdir: str, filename: str) -> Path:
        """Build and validate a storage path, preventing path traversal."""
        base = (self.upload_dir / subdir).resolve()
        target = (base / filename).resolve()
        # Verify the resolved path is inside the base directory
        if not str(target).startswith(str(base)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path.",
            )
        return target

    def _generate_filename(self, extension: str) -> str:
        """Generate a UUID-based filename. Never use the original name."""
        return f"{uuid.uuid4().hex}{extension}"

    def _validate_mime(self, data: bytes, allowed_mimes: set[str]) -> str:
        """Check file signature (magic bytes). Returns detected MIME type."""
        if MAGIC_AVAILABLE:
            detected = magic.from_buffer(data, mime=True)
            if detected not in allowed_mimes:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"File type not allowed. Detected: {detected}",
                )
            return detected
        # Fallback: basic PDF check
        if b"%PDF-" in data[:10]:
            return "application/pdf"
        return "application/octet-stream"

    def _validate_pdf(self, data: bytes) -> None:
        """Basic PDF magic byte validation."""
        if not data.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="File does not appear to be a valid PDF.",
            )

    async def save_image(
        self,
        file: UploadFile,
        subdir: str = "images",
    ) -> str:
        """
        Validate, re-encode, and save an image file.
        Returns the relative path for storage in the database.
        """
        # 1. Read data
        data = await file.read()

        # 2. Size check
        if len(data) > settings.max_image_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image must be under {settings.MAX_IMAGE_SIZE_MB}MB.",
            )

        # 3. Extension check (allowlist, case-insensitive)
        original_ext = Path(file.filename or "").suffix.lower()
        if original_ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Extension '{original_ext}' is not allowed.",
            )

        # 4. MIME / magic-byte check
        self._validate_mime(data, ALLOWED_IMAGE_MIMES)

        # 5. Re-encode via Pillow (strips EXIF, prevents polyglot payloads)
        try:
            img = Image.open(io.BytesIO(data))
            img.verify()  # detect truncated/corrupt images
            img = Image.open(io.BytesIO(data))  # re-open after verify

            # Dimension check (decompression bomb protection)
            if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image dimensions must not exceed {MAX_IMAGE_DIMENSION}px.",
                )

            # Convert to RGB (handle RGBA, palette, etc.)
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85, optimize=True)
            clean_data = buffer.getvalue()
            save_ext = ".jpg"
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("image_processing_error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not process image. Please upload a valid image file.",
            )

        # 6. Generate safe server-side filename and save
        filename = self._generate_filename(save_ext)
        dest = self._safe_path(subdir, filename)
        dest.write_bytes(clean_data)

        logger.info("image_saved", subdir=subdir, filename=filename, size=len(clean_data))
        return f"{subdir}/{filename}"

    async def save_document(self, file: UploadFile, subdir: str = "documents") -> tuple[str, str]:
        """
        Validate and save a PDF document.
        Returns (relative_path, original_safe_filename).
        """
        data = await file.read()

        # Size check
        if len(data) > settings.max_document_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Document must be under {settings.MAX_DOCUMENT_SIZE_MB}MB.",
            )

        # Extension check
        original_ext = Path(file.filename or "").suffix.lower()
        if original_ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF documents are allowed.",
            )

        # MIME and magic-byte validation
        self._validate_mime(data, ALLOWED_DOCUMENT_MIMES)
        self._validate_pdf(data)

        # Save with UUID filename
        filename = self._generate_filename(".pdf")
        dest = self._safe_path(subdir, filename)
        dest.write_bytes(data)

        # Return a sanitized version of the original filename (for display only)
        safe_original = Path(file.filename or "document").stem[:100] + ".pdf"
        safe_original = "".join(c for c in safe_original if c.isalnum() or c in "-_. ")

        logger.info("document_saved", subdir=subdir, filename=filename)
        return f"{subdir}/{filename}", safe_original

    def get_absolute_path(self, relative_path: str) -> Path:
        """Safely resolve a stored relative path to an absolute path."""
        parts = relative_path.lstrip("/").split("/")
        if len(parts) < 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path.")

        subdir = parts[0]
        filename = parts[1]

        # Extra validation: no traversal sequences
        for part in parts:
            if ".." in part or part.startswith("/"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path.")

        return self._safe_path(subdir, filename)

    def delete_file(self, relative_path: str) -> None:
        """Delete a stored file by its relative path."""
        try:
            abs_path = self.get_absolute_path(relative_path)
            if abs_path.exists():
                abs_path.unlink()
        except Exception:
            pass  # File deletion failure is non-fatal


def get_storage() -> StorageService:
    return StorageService()
