from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.middleware.security_headers import SecurityHeadersMiddleware

settings = get_settings()
configure_logging(debug=settings.DEBUG)
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", environment=settings.ENVIRONMENT)
    # Ensure uploads directory exists
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    
    try:
        from app.core.database import engine, Base, AsyncSessionLocal
        import app.models  # noqa: F401
        from app.models.user import User, UserRole
        from sqlalchemy import select
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("database_tables_ready")

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User))
            users = result.scalars().all()
            for u in users:
                is_seed_email = settings.SEED_ADMIN_EMAIL and u.email.lower() == settings.SEED_ADMIN_EMAIL.lower()
                no_super_admin = not any(
                    str(getattr(x.role, "value", x.role)).lower().endswith("super_admin") for x in users
                )
                if is_seed_email or len(users) == 1 or no_super_admin:
                    if not str(getattr(u.role, "value", u.role)).lower().endswith("super_admin"):
                        u.role = UserRole.SUPER_ADMIN
                        await session.commit()
                        logger.info("ensured_super_admin", email=u.email)
                    break
    except Exception as e:
        logger.error("database_startup_init_error", error=str(e))

    yield
    logger.info("shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="DTMN API",
        version="1.0.0",
        # Disable docs in production
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Security headers (inner)
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS — must be the outermost middleware (added last in FastAPI)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # API routes
    app.include_router(api_router)

    # Serve uploaded files (static file serving)
    uploads_path = Path(settings.UPLOAD_DIR)
    uploads_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

    # Global exception handler — never leak stack traces in production
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_exception", error=str(exc), path=request.url.path, exc_info=True)
        if settings.DEBUG:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": str(exc)},
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred. Please try again later."},
        )

    @app.get("/health")
    async def health_check() -> dict:
        return {"status": "ok", "environment": settings.ENVIRONMENT}

    return app


app = create_app()
