"""
Audit log service — records all important admin actions.
Never expose these records publicly.
"""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import AuditLog
from app.models.user import User


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log(
        self,
        action: str,
        user: User | None = None,
        resource_type: str | None = None,
        resource_id: str | int | None = None,
        ip_address: str | None = None,
        details: dict[str, Any] | None = None,
        result: str = "success",
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            ip_address=ip_address,
            details=json.dumps(details) if details else None,
            result=result,
        )
        self.db.add(entry)
        await self.db.commit()
        return entry
