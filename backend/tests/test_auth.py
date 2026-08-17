"""
Authentication security tests.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/login", json={"email": "nobody@test.com", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_invalid_email_format(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/login", json={"email": "not-an-email", "password": "pass"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_empty_body(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/login", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout_unauthenticated(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/logout")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_without_cookie(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/refresh")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_events_unauthenticated(client: AsyncClient) -> None:
    """Admin endpoints must return 401 without authentication."""
    resp = await client.get("/api/v1/admin/events")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_users_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/users")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_mfa_verify_without_pending_cookie(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/mfa/verify", json={"code": "123456"})
    assert resp.status_code == 400
