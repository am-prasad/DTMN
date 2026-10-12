"""
Secure file storage service.

STORAGE_BACKEND=local  -> local disk (default, dev / VPS)
STORAGE_BACKEND=s3     -> any S3-compatible bucket (AWS, Cloudflare R2, Backblaze B2, MinIO)

Security: UUID filenames, MIME validation, Pillow re-encode, PDF magic bytes, path traversal prevention.
"""
from __future__ import annotations

import io
import uuid
from pathlib import Path
from typing import Optional

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

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_DOCUMENT_MIMES = {"application/pdf"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf"}
ALL_SUBDIRS = ["images", "documents", "faculty", "gallery", "activities", "sections"]
MAX_IMAGE_DIMENSION = 6000


def _validate_mime(data: bytes, allowed_mimes: set) -> str:
    if MAGIC_AVAILABLE:
        detected = magic.from_buffer(data, mime=True)
        if detected not in allowed_mimes:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail=f"File type not allowed. Detected: {detected}")
        return detected
    if "application/pdf" in allowed_mimes:
        if not data.startswith(b"%PDF-"):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail="File does not appear to be a valid PDF.")
        return "application/pdf"
    return "image/jpeg"


def _validate_pdf_magic(data: bytes) -> None:
    if not data.startswith(b"%PDF-"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail="File does not appear to be a valid PDF.")


def _generate_filename(extension: str) -> str:
    return f"{uuid.uuid4().hex}{extension}"


def _reencode_image(data: bytes) -> tuple:
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Image dimensions must not exceed {MAX_IMAGE_DIMENSION}px.")
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        return buf.getvalue(), ".jpg"
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("image_reencode_error", error=str(exc))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Could not process image. Please upload a valid image file.")


class LocalStorageService:
    def __init__(self) -> None:
        self.upload_dir = Path(settings.UPLOAD_DIR).resolve()
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        for sub in ALL_SUBDIRS:
            (self.upload_dir / sub).mkdir(exist_ok=True)

    def _safe_path(self, subdir: str, filename: str) -> Path:
        base = (self.upload_dir / subdir).resolve()
        target = (base / filename).resolve()
        if not str(target).startswith(str(base)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path.")
        return target

    async def save_image(self, file: UploadFile, subdir: str = "images") -> str:
        data = await file.read()
        if len(data) > settings.max_image_size_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                detail=f"Image must be under {settings.MAX_IMAGE_SIZE_MB}MB.")
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail=f"Extension '{ext}' is not allowed.")
        _validate_mime(data, ALLOWED_IMAGE_MIMES)
        clean_data, save_ext = _reencode_image(data)
        filename = _generate_filename(save_ext)
        self._safe_path(subdir, filename).write_bytes(clean_data)
        logger.info("local_image_saved", subdir=subdir, filename=filename, size=len(clean_data))
        return f"{subdir}/{filename}"

    async def save_document(self, file: UploadFile, subdir: str = "documents") -> tuple:
        data = await file.read()
        if len(data) > settings.max_document_size_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                detail=f"Document must be under {settings.MAX_DOCUMENT_SIZE_MB}MB.")
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail="Only PDF documents are allowed.")
        _validate_mime(data, ALLOWED_DOCUMENT_MIMES)
        _validate_pdf_magic(data)
        filename = _generate_filename(".pdf")
        self._safe_path(subdir, filename).write_bytes(data)
        safe_original = Path(file.filename or "document").stem[:100] + ".pdf"
        safe_original = "".join(c for c in safe_original if c.isalnum() or c in "-_. ")
        logger.info("local_document_saved", subdir=subdir, filename=filename)
        return f"{subdir}/{filename}", safe_original

    def get_absolute_path(self, relative_path: str) -> Path:
        parts = relative_path.lstrip("/").split("/")
        if len(parts) < 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path.")
        for part in parts:
            if ".." in part or part.startswith("/"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path.")
        return self._safe_path(parts[0], parts[1])

    def delete_file(self, relative_path: str) -> None:
        try:
            abs_path = self.get_absolute_path(relative_path)
            if abs_path.exists():
                abs_path.unlink()
        except Exception:
            pass


class S3StorageService:
    """
    S3-compatible backend. Set these in .env:
        STORAGE_BACKEND=s3
        STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com  (or leave blank for AWS)
        STORAGE_ACCESS_KEY=...
        STORAGE_SECRET_KEY=...
        STORAGE_BUCKET=...
        STORAGE_REGION=auto  (or us-east-1 etc.)
    Requires: pip install aioboto3
    """

    def __init__(self) -> None:
        if not settings.STORAGE_BUCKET:
            raise RuntimeError("STORAGE_BUCKET must be set when STORAGE_BACKEND=s3")
        if not settings.STORAGE_ACCESS_KEY or not settings.STORAGE_SECRET_KEY:
            raise RuntimeError("STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY must be set when STORAGE_BACKEND=s3")
        try:
            import aioboto3
            self._aioboto3 = aioboto3
        except ImportError:
            raise RuntimeError("Run: pip install aioboto3")
        self._bucket = settings.STORAGE_BUCKET
        self._endpoint = settings.STORAGE_ENDPOINT.strip() or None
        self._region = settings.STORAGE_REGION.strip() or "auto"

    def _session(self):
        return self._aioboto3.Session(
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
            region_name=self._region,
        )

    async def _put(self, data: bytes, key: str, content_type: str) -> None:
        kwargs = dict(Bucket=self._bucket, Key=key, Body=data, ContentType=content_type)
        is_r2 = self._endpoint and "r2.cloudflarestorage.com" in self._endpoint
        if not is_r2:
            kwargs["ACL"] = "public-read"
        async with self._session().client("s3", endpoint_url=self._endpoint) as s3:
            await s3.put_object(**kwargs)

    async def save_image(self, file: UploadFile, subdir: str = "images") -> str:
        data = await file.read()
        if len(data) > settings.max_image_size_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                detail=f"Image must be under {settings.MAX_IMAGE_SIZE_MB}MB.")
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail=f"Extension '{ext}' is not allowed.")
        _validate_mime(data, ALLOWED_IMAGE_MIMES)
        clean_data, _ = _reencode_image(data)
        key = f"{subdir}/{_generate_filename('.jpg')}"
        await self._put(clean_data, key, "image/jpeg")
        logger.info("s3_image_saved", key=key, size=len(clean_data))
        return key

    async def save_document(self, file: UploadFile, subdir: str = "documents") -> tuple:
        data = await file.read()
        if len(data) > settings.max_document_size_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                detail=f"Document must be under {settings.MAX_DOCUMENT_SIZE_MB}MB.")
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail="Only PDF documents are allowed.")
        _validate_mime(data, ALLOWED_DOCUMENT_MIMES)
        _validate_pdf_magic(data)
        key = f"{subdir}/{_generate_filename('.pdf')}"
        await self._put(data, key, "application/pdf")
        safe_original = Path(file.filename or "document").stem[:100] + ".pdf"
        safe_original = "".join(c for c in safe_original if c.isalnum() or c in "-_. ")
        logger.info("s3_document_saved", key=key)
        return key, safe_original

    def get_absolute_path(self, relative_path: str) -> Path:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,
                            detail="Direct path access unavailable in S3 mode.")

    def delete_file(self, relative_path: str) -> None:
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(self._delete_async(relative_path))
            else:
                loop.run_until_complete(self._delete_async(relative_path))
        except Exception as exc:
            logger.warning("s3_delete_error", key=relative_path, error=str(exc))

    async def _delete_async(self, key: str) -> None:
        async with self._session().client("s3", endpoint_url=self._endpoint) as s3:
            await s3.delete_object(Bucket=self._bucket, Key=key)


StorageService = LocalStorageService


def get_storage() -> LocalStorageService | S3StorageService:
    """FastAPI dependency: storage: StorageService = Depends(get_storage)"""
    if settings.STORAGE_BACKEND == "s3":
        return S3StorageService()
    return LocalStorageService()


def get_file_url(relative_path: Optional[str]) -> Optional[str]:
    """Return the public URL for a stored file path (local or S3)."""
    if not relative_path:
        return None
    if relative_path.startswith("http"):
        return relative_path
    if settings.STORAGE_BACKEND == "s3":
        ep = settings.STORAGE_ENDPOINT.rstrip("/")
        if ep:
            return f"{ep}/{settings.STORAGE_BUCKET}/{relative_path}"
        return f"https://{settings.STORAGE_BUCKET}.s3.{settings.STORAGE_REGION}.amazonaws.com/{relative_path}"
    return f"{settings.BACKEND_URL.rstrip('/')}/uploads/{relative_path}"
