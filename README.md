# [Institution Name] — Official Website

A complete, production-quality website for an educational institution operating across four academic sections: Nursery, Primary School, High School, and College.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, App Router |
| Backend | FastAPI (Python), SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL (asyncpg driver) |
| Auth | Argon2id + JWT + TOTP MFA |
| Uploads | Secure local storage (UUID filenames, MIME validation, Pillow strip) |
| Dev DB | Docker Compose (PostgreSQL + pgAdmin) |

---

## Quick Start

### 1. Prerequisites
- Docker Desktop (for PostgreSQL)
- Python 3.11+
- Node.js 18+
- `psycopg2-binary` for Alembic migrations

### 2. Start the database
```bash
cd d:/dtmn
docker-compose up -d
```

### 3. Backend setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate         # Windows
# or: source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your values (JWT secrets, DB URL, etc.)

# Run Alembic migrations
# Note: requires psycopg2 in addition to asyncpg for Alembic
pip install psycopg2-binary
alembic upgrade head

# Seed demo data
python seed.py

# Start the development server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend setup
```bash
cd frontend

# Copy env
copy .env.local.example .env.local

# Install dependencies
npm install

# Start dev server
npm run dev
```

The site is now available at `http://localhost:3000`.
The API docs (dev only) are at `http://localhost:8000/api/docs`.
The admin panel is at `http://localhost:3000/admin/login`.

---

## Default Admin Credentials

After running `seed.py`:

- **Email:** Set in `.env` as `SEED_ADMIN_EMAIL` (default: `admin@institution.local`)
- **Password:** Set in `.env` as `SEED_ADMIN_PASSWORD` (default: `Admin@1234!Temp`)

> ⚠️ **Change the admin password immediately after first login.**

---

## Project Structure

```
d:/dtmn/
├── docker-compose.yml          # PostgreSQL + pgAdmin
├── .gitignore
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app factory
│   │   ├── api/                # Route handlers
│   │   ├── core/               # Config, security, DB, deps
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Audit, Storage
│   │   └── repositories/       # Data access layer
│   ├── alembic/                # DB migrations
│   ├── tests/                  # pytest tests
│   ├── seed.py                 # Demo data seeder
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/                    # Next.js App Router pages
    │   ├── (public pages)
    │   └── admin/              # Admin panel
    ├── components/             # React components
    │   ├── layout/             # Navbar, Footer
    │   ├── common/             # EventCard, FacultyCard, etc.
    │   ├── home/               # Homepage sections
    │   └── admin/              # AdminShell, AdminTable, Modal
    ├── lib/                    # API client, utils
    ├── types/                  # TypeScript types
    └── middleware.ts            # Auth guard for /admin routes
```

---

## Before Going Live

1. **Replace all `[placeholder]` text** — search for `[` across the codebase
2. **Update `.env`** — set strong unique secrets for JWT, database
3. **Add MFA** — enable TOTP for all admin accounts
4. **Map OpenStreetMap coordinates** — update the iframe in `ContactSection.tsx`
5. **Configure SMTP** — add an email service for contact form notifications
6. **Set up HTTPS** — use a reverse proxy (nginx/Caddy) with Let's Encrypt
7. **Database backups** — set up automated PostgreSQL backups
8. **Run tests** — `cd backend && pytest`

---

## Security Notes

- All passwords use **Argon2id** hashing
- JWT access tokens expire in 30 minutes; refresh tokens in 7 days
- Admin MFA with TOTP (Google Authenticator compatible)
- All file uploads: UUID names, MIME type validation, image re-encoding, path traversal prevention
- SQL injection protection via SQLAlchemy ORM (parameterised queries)
- XSS protection via `bleach` sanitiser on HTML content fields
- CSRF mitigation: JSON-only API, `SameSite` cookies
- Rate limiting on all endpoints (200 req/min default)
- Security headers on all responses
- All admin actions logged to the audit table
