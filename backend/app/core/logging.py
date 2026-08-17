"""
Structured logging configuration using structlog.

Security note: Never log passwords, tokens, MFA secrets, or sensitive PII.
"""
from __future__ import annotations

import logging
import sys

import structlog


def configure_logging(debug: bool = False) -> None:
    """Configure structlog with appropriate processors for the environment."""

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
    ]

    if debug:
        # Human-readable output for development
        renderer = structlog.dev.ConsoleRenderer()
    else:
        # JSON output for production log aggregation
        renderer = structlog.processors.JSONRenderer()

    logging.basicConfig(
    level=logging.DEBUG if debug else logging.INFO,
    format="%(message)s",
)

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if debug else logging.INFO
        ),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.BoundLogger:
    """Get a structlog logger instance."""
    return structlog.get_logger(name)


# ---------------------------------------------------------------------------
# Security event helpers — call these for audit-relevant events
# ---------------------------------------------------------------------------
def log_security_event(
    event: str,
    user_id: str | None = None,
    ip_address: str | None = None,
    **kwargs,
) -> None:
    """Log a security-relevant event. Never include passwords or tokens."""
    logger = get_logger("security")
    logger.info(
        event,
        user_id=user_id,
        ip_address=ip_address,
        **kwargs,
    )
