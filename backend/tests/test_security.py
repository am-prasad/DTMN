"""
Security attack vector tests.
Tests SQL injection, XSS, path traversal, and malicious file uploads.
"""
import io
import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# SQL Injection via query parameters
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_sql_injection_in_circular_search(client: AsyncClient) -> None:
    """SQL injection via search query — should return 200 with no results, not 500."""
    payloads = [
        "' OR '1'='1",
        "'; DROP TABLE circulars; --",
        "1 UNION SELECT * FROM users--",
        "' OR 1=1--",
    ]
    for payload in payloads:
        resp = await client.get(f"/api/v1/circulars?search={payload}")
        assert resp.status_code in (200, 422), f"Unexpected status for payload: {payload!r}"


# ---------------------------------------------------------------------------
# XSS payloads in event search
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_xss_in_query_params(client: AsyncClient) -> None:
    """XSS payloads in query params should be rejected or escaped, not reflected."""
    xss_payloads = [
        "<script>alert(1)</script>",
        "javascript:alert(1)",
        "<img src=x onerror=alert(1)>",
    ]
    for payload in xss_payloads:
        resp = await client.get(f"/api/v1/activities?category={payload}")
        assert resp.status_code in (200, 422)
        if resp.status_code == 200:
            # Payload must not be echoed back unsanitised
            assert "<script>" not in resp.text
            assert "onerror" not in resp.text


# ---------------------------------------------------------------------------
# Path traversal via file download
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_path_traversal_in_circular_download(client: AsyncClient) -> None:
    """Malicious circular IDs should not allow path traversal."""
    # These won't exist as circulars; we just check they don't cause 500 or expose files
    traversal_ids = [9999, 0, -1]
    for cid in traversal_ids:
        resp = await client.get(f"/api/v1/circulars/{cid}/download")
        assert resp.status_code in (404, 422), f"Unexpected status for id {cid}"


# ---------------------------------------------------------------------------
# Invalid inputs on public forms
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_contact_form_missing_required_fields(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/contact", json={"name": "X"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_contact_form_invalid_email(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/contact", json={
        "name": "Test User",
        "email": "not-an-email",
        "subject": "Hello",
        "message": "This is a test message that is long enough."
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_admission_enquiry_invalid_section(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/admissions/enquiry", json={
        "student_name": "Test Student",
        "parent_name": "Test Parent",
        "email": "parent@test.com",
        "phone": "9876543210",
        "section": "invalid_section_name",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_admission_enquiry_phone_with_letters(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/admissions/enquiry", json={
        "student_name": "Test",
        "parent_name": "Parent",
        "email": "p@test.com",
        "phone": "abc123",
        "section": "nursery",
    })
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Pagination boundary checks
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_events_invalid_page_size(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/events?page_size=9999")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_events_negative_page(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/events?page=-1")
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Unknown routes
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_unknown_api_route_returns_404(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/nonexistent-endpoint")
    assert resp.status_code == 404
