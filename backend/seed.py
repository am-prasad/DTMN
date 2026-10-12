"""
Database seed script.

Creates clearly fictional demo data so the website can be tested immediately.
All content is marked as placeholder and should be replaced before go-live.

Idempotent: Safe to run multiple times without duplicate key or integrity errors.

Run:
    cd backend
    python seed.py
"""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import date, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database import Base
from app.core.security import hash_password
import app.models  # noqa: F401 — ensure all models are registered on Base.metadata
from app.models.academic_section import AcademicSection
from app.models.activity import Activity, ActivityCategory
from app.models.admission import AdmissionInfo
from app.models.circular import Circular, CircularCategory
from app.models.content import SiteContent
from app.models.event import Event, EventCategory
from app.models.facility import Facility
from app.models.faculty import AcademicSectionSlug, Department, Faculty
from app.models.gallery import GalleryAlbum
from app.models.user import User, UserRole

settings = get_settings()


async def get_or_create(db: AsyncSession, model: Any, defaults: dict[str, Any] | None = None, **lookup: Any) -> tuple[Any, bool]:
    """Helper for idempotent seeding."""
    result = await db.execute(select(model).filter_by(**lookup))
    obj = result.scalar_one_or_none()
    if obj:
        return obj, False
    obj = model(**lookup, **(defaults or {}))
    db.add(obj)
    await db.flush()
    return obj, True


async def seed(db: AsyncSession) -> None:
    print("🌱 Seeding database with demo data (idempotent)...")

    # -----------------------------------------------------------------------
    # Super Admin user (S6: lowercase email, idempotent)
    # -----------------------------------------------------------------------
    if not settings.SEED_ADMIN_PASSWORD:
        raise RuntimeError(
            "SEED_ADMIN_PASSWORD is not set. "
            "Set it in your .env file before running seed.py. "
            "Never use a hardcoded or public default password."
        )

    admin_email = settings.SEED_ADMIN_EMAIL.lower().strip()
    admin, created = await get_or_create(
        db,
        User,
        defaults={
            "hashed_password": hash_password(settings.SEED_ADMIN_PASSWORD),
            "full_name": "[Administrator Name]",
            "role": UserRole.SUPER_ADMIN,
            "is_active": True,
            "must_change_password": True,
        },
        email=admin_email,
    )
    if created:
        print(f"✅ Super Admin created: {admin_email}")
    else:
        admin.role = UserRole.SUPER_ADMIN
        admin.is_active = True
        await db.commit()
        print(f"ℹ️  Super Admin already exists and verified as SUPER_ADMIN: {admin_email}")
    print("⚠️  Default password — CHANGE IMMEDIATELY after first login.")

    # -----------------------------------------------------------------------
    # Site Content
    # -----------------------------------------------------------------------
    content_items = [
        ("institution_name", "D T M N", "text", "Institution Name", "general"),
        ("institution_tagline", "Inspiring Minds, Building Futures", "text", "Tagline", "general"),
        ("institution_intro", "D T M N has been dedicated to quality education since 2001. We are committed to nurturing well-rounded individuals through academic excellence, character development, and holistic growth.", "text", "Homepage Introduction", "homepage"),
        ("institution_address", "[Full Address]\nBettadapura, Karnataka", "text", "Address", "contact"),
        ("institution_phone", "+91 98765 43210", "text", "Main Phone", "contact"),
        ("institution_email", "info@dtmn.edu.in", "text", "Main Email", "contact"),
        ("institution_office_hours", "Monday – Friday: 9:00 AM – 4:00 PM\nSaturday: 9:00 AM – 1:00 PM", "text", "Office Hours", "contact"),
        ("admission_contact_email", "admissions@dtmn.edu.in", "text", "Admissions Email", "contact"),
        ("admission_contact_phone", "+91 98765 43211", "text", "Admissions Phone", "contact"),
        ("about_history", "D T M N was established in 2001 with a vision to provide quality education to the community. Over the decades, we have grown from a small school to a comprehensive educational institution covering Nursery through College.", "text", "Institution History", "about"),
        ("about_vision", "To be a premier institution that nurtures curious, compassionate, and capable individuals prepared for an ever-changing world.", "text", "Vision", "about"),
        ("about_mission", "To provide a supportive, stimulating, and inclusive learning environment that develops the intellectual, creative, social, and ethical potential of every student.", "text", "Mission", "about"),
        ("about_values", "Academic Excellence | Integrity | Inclusivity | Respect | Lifelong Learning", "text", "Values", "about"),
        ("principal_name", "[Principal Name]", "text", "Principal Name", "about"),
        ("principal_designation", "Principal", "text", "Principal Designation", "about"),
        ("principal_message", "Dear Students, Parents, and Well-wishers,\n\nWelcome to [Institution Name]. It is my privilege to lead this institution, and I am deeply proud of our community's commitment to educational excellence and holistic development. We believe that every student possesses unique potential, and it is our responsibility to help each one discover and develop it.\n\n[Principal Name]", "text", "Principal's Message", "about"),
        ("footer_tagline", "Inspiring minds since 2001.", "text", "Footer Tagline", "footer"),
        ("social_facebook", "", "text", "Facebook URL", "social"),
        ("social_twitter", "", "text", "Twitter/X URL", "social"),
        ("social_instagram", "", "text", "Instagram URL", "social"),
        ("social_youtube", "", "text", "YouTube URL", "social"),
    ]
    for key, value, ctype, label, group in content_items:
        await get_or_create(
            db,
            SiteContent,
            defaults={"value": value, "content_type": ctype, "label": label, "group": group},
            key=key,
        )

    # -----------------------------------------------------------------------
    # Academic Sections
    # -----------------------------------------------------------------------
    sections = [
        {
            "slug": "nursery",
            "name": "Nursery",
            "tagline": "Where every child's journey begins",
            "description": "Our Nursery programme offers a nurturing, play-based environment where young learners develop foundational cognitive, social, and emotional skills. Small class sizes ensure individual attention for every child.",
            "head_name": "[Head of Nursery]",
            "head_designation": "Head of Nursery Section",
            "head_message": "Our Nursery is a safe, loving space where curiosity is celebrated and every small step is a great leap. We work closely with families to ensure each child feels confident, happy, and ready to learn.",
            "programs": "Play Group | Nursery | Lower Kindergarten (LKG) | Upper Kindergarten (UKG)",
        },
        {
            "slug": "primary",
            "name": "Primary School",
            "tagline": "Building strong foundations for lifelong learning",
            "description": "Our Primary School (Classes I – V) focuses on developing literacy, numeracy, scientific thinking, and creativity within a structured and supportive environment.",
            "head_name": "[Head of Primary]",
            "head_designation": "Head of Primary School",
            "head_message": "The primary years are critical in a child's development. We combine structured academics with activities that develop creativity, critical thinking, and values — all essential for the years ahead.",
            "programs": "Class I | Class II | Class III | Class IV | Class V",
        },
        {
            "slug": "high-school",
            "name": "High School",
            "tagline": "Academic excellence and personal development",
            "description": "Our High School (Classes VI – X) offers a comprehensive academic programme that prepares students for board examinations and builds the discipline and resilience needed for higher studies.",
            "head_name": "[Head of High School]",
            "head_designation": "Head of High School",
            "head_message": "High School is a formative period. We challenge our students academically while supporting their individual interests and personal growth, preparing them to meet the demands of board examinations with confidence.",
            "programs": "Class VI | Class VII | Class VIII | Class IX | Class X",
        },
        {
            "slug": "college",
            "name": "College",
            "tagline": "Preparing tomorrow's professionals and leaders",
            "description": "Our College section offers programmes in Science, Commerce, and Arts streams, providing students with the academic rigour and exposure needed for professional careers and further studies.",
            "head_name": "[Head of College]",
            "head_designation": "Head of College Section",
            "head_message": "College is where students transition into young adults with clear goals. We offer academic rigour, mentorship, and an environment that prepares our students for universities and professional careers.",
            "programs": "Science Stream (Physics, Chemistry, Biology / Mathematics)\nCommerce Stream (Accountancy, Business Studies, Economics)\nArts Stream (History, Political Science, Sociology, Literature)",
        },
    ]
    for s in sections:
        slug = s["slug"]
        defaults = {k: v for k, v in s.items() if k != "slug"}
        await get_or_create(db, AcademicSection, defaults=defaults, slug=slug)

    # -----------------------------------------------------------------------
    # Departments & Faculty
    # -----------------------------------------------------------------------
    depts = [
        ("Science", AcademicSectionSlug.HIGH_SCHOOL),
        ("Mathematics", AcademicSectionSlug.HIGH_SCHOOL),
        ("Languages", AcademicSectionSlug.HIGH_SCHOOL),
        ("Social Studies", AcademicSectionSlug.HIGH_SCHOOL),
        ("Commerce", AcademicSectionSlug.COLLEGE),
        ("Arts & Humanities", AcademicSectionSlug.COLLEGE),
    ]
    dept_objs = []
    for d_name, d_section in depts:
        obj, _ = await get_or_create(db, Department, name=d_name, section=d_section)
        dept_objs.append(obj)

    faculty_members = [
        ("[Faculty Member A]", "Senior Teacher", "M.Sc. Physics, B.Ed.", 12, "[Faculty Member A] has been teaching Physics at [Institution Name] for over a decade. Known for making complex concepts accessible to students.", AcademicSectionSlug.HIGH_SCHOOL, dept_objs[0].id, 1),
        ("[Faculty Member B]", "Mathematics Teacher", "M.Sc. Mathematics, B.Ed.", 8, "[Faculty Member B] specialises in making mathematics intuitive and engaging for students of all abilities.", AcademicSectionSlug.HIGH_SCHOOL, dept_objs[1].id, 2),
        ("[Faculty Member C]", "English Teacher", "M.A. English Literature, B.Ed.", 10, "[Faculty Member C] brings literature to life in the classroom, fostering a love of reading and strong writing skills.", AcademicSectionSlug.HIGH_SCHOOL, dept_objs[2].id, 3),
        ("[Faculty Member D]", "Commerce Lecturer", "M.Com., B.Ed.", 6, "[Faculty Member D] guides College Commerce students through Accountancy and Business Studies with a practical, industry-oriented approach.", AcademicSectionSlug.COLLEGE, dept_objs[4].id, 1),
        ("[Faculty Member E]", "Class Teacher – Nursery", "B.Ed. (Early Childhood Education)", 5, "[Faculty Member E] creates a warm and stimulating environment where Nursery children develop confidence through play and structured activities.", AcademicSectionSlug.NURSERY, None, 1),
        ("[Faculty Member F]", "Class Teacher – Primary IV", "B.Sc., B.Ed.", 7, "[Faculty Member F] is dedicated to building strong academic foundations with an emphasis on curiosity and independent thinking.", AcademicSectionSlug.PRIMARY, None, 1),
    ]
    for name, desig, qual, exp, bio, sec, dept_id, sort_order in faculty_members:
        await get_or_create(
            db,
            Faculty,
            defaults={
                "designation": desig,
                "qualification": qual,
                "experience_years": exp,
                "bio": bio,
                "department_id": dept_id,
                "sort_order": sort_order,
                "is_active": True,
            },
            name=name,
            section=sec,
        )

    # -----------------------------------------------------------------------
    # Facilities
    # -----------------------------------------------------------------------
    facilities = [
        ("Classrooms", "Spacious, well-ventilated classrooms with natural lighting and modern teaching aids across all sections.", "Academic", "Building2", 1),
        ("Science Laboratories", "Fully equipped Physics, Chemistry, and Biology laboratories for hands-on experimentation and learning.", "Academic", "FlaskConical", 2),
        ("Library", "A well-stocked library with an extensive collection of textbooks, reference materials, and fiction for all age groups.", "Academic", "BookOpen", 3),
        ("Computer Laboratory", "Modern computer facilities with internet access, supporting digital literacy and programming education.", "Technology", "Monitor", 4),
        ("Sports Facilities", "Facilities for cricket, football, basketball, badminton, athletics, and indoor games, supervised by qualified sports instructors.", "Sports", "Trophy", 5),
        ("Auditorium", "A spacious auditorium used for cultural events, seminars, debates, and school functions.", "Events", "Theater", 6),
        ("Transport", "A fleet of school buses covering key routes across the city, with trained drivers and attendants.", "Transport", "Bus", 7),
        ("Medical Room", "A medical room staffed by a qualified nurse, with first-aid facilities and emergency protocols in place.", "Welfare", "HeartPulse", 8),
    ]
    for name, desc, cat, icon, sort_order in facilities:
        await get_or_create(
            db,
            Facility,
            defaults={"description": desc, "category": cat, "icon": icon, "sort_order": sort_order, "is_active": True},
            name=name,
        )

    # -----------------------------------------------------------------------
    # Event Categories + Events
    # -----------------------------------------------------------------------
    cat_academic, _ = await get_or_create(db, EventCategory, name="Academic", slug="academic")
    cat_sports, _ = await get_or_create(db, EventCategory, name="Sports", slug="sports")
    cat_cultural, _ = await get_or_create(db, EventCategory, name="Cultural", slug="cultural")
    cat_general, _ = await get_or_create(db, EventCategory, name="General", slug="general")

    today = date.today()
    events = [
        ("Annual Sports Day", "annual-sports-day", "[Institution Name]'s Annual Sports Day celebrates athletic achievement and sportsmanship across all sections. Students compete in track and field events, team sports, and fun activities.", today + timedelta(days=14), "School Grounds", True, cat_sports.id),
        ("Science Exhibition [Year]", "science-exhibition", "Our annual Science Exhibition showcases student projects from Classes VIII to XII. Open to parents and visitors. Exhibition includes live demonstrations and judged project competition.", today + timedelta(days=28), "School Auditorium", True, cat_academic.id),
        ("Cultural Evening", "cultural-evening", "A celebration of art, music, dance, and drama performed by students from all sections. A cherished annual event that brings together the entire school community.", today + timedelta(days=45), "School Auditorium", True, cat_cultural.id),
        ("Parent-Teacher Meeting – Term I", "ptm-term-1", "An opportunity for parents to meet their child's teachers, discuss academic progress, and address individual needs.", today + timedelta(days=7), "Respective Classrooms", True, cat_general.id),
    ]
    for title, slug, desc, ev_date, venue, is_pub, cat_id in events:
        await get_or_create(
            db,
            Event,
            defaults={"title": title, "description": desc, "event_date": ev_date, "venue": venue, "is_published": is_pub, "category_id": cat_id},
            slug=slug,
        )

    # -----------------------------------------------------------------------
    # Circulars
    # -----------------------------------------------------------------------
    circulars = [
        ("Academic Calendar [Year]", "academic-calendar", "Please find attached the Academic Calendar for the current session. All examinations, holidays, and events are listed.", CircularCategory.ACADEMIC, True, today),
        ("Summer Vacation Notice", "summer-vacation-notice", "School will remain closed for Summer Vacation from [Date] to [Date]. Classes resume on [Date]. Please ensure children complete their holiday assignments.", CircularCategory.HOLIDAYS, True, today - timedelta(days=5)),
        ("Admission Open – [Academic Year]", "admissions-open", "Admissions are now open for the upcoming academic session across all sections – Nursery, Primary, High School, and College. Interested parents are invited to collect the prospectus from the school office or apply online.", CircularCategory.ADMISSIONS, True, today - timedelta(days=10)),
        ("Term I Examination Schedule", "term-1-examination-schedule", "The examination schedule for Term I has been finalised. Students are advised to prepare accordingly. Any queries may be directed to the respective class teachers.", CircularCategory.EXAMINATION, True, today - timedelta(days=3)),
    ]
    for title, slug, desc, cat, is_pub, pub_at in circulars:
        await get_or_create(
            db,
            Circular,
            defaults={"title": title, "description": desc, "category": cat, "is_published": is_pub, "published_at": pub_at},
            slug=slug,
        )

    # -----------------------------------------------------------------------
    # Activity Categories + Activities
    # -----------------------------------------------------------------------
    act_cat_sports, _ = await get_or_create(db, ActivityCategory, name="Sports", slug="sports")
    act_cat_cultural, _ = await get_or_create(db, ActivityCategory, name="Cultural", slug="cultural")
    act_cat_academic, _ = await get_or_create(db, ActivityCategory, name="Academic", slug="academic")
    act_cat_community, _ = await get_or_create(db, ActivityCategory, name="Community", slug="community")

    activities = [
        ("Inter-School Cricket Tournament", "cricket-tournament", "Our cricket team participated in the Inter-School Cricket Tournament and demonstrated outstanding sportsmanship and team spirit.", today - timedelta(days=30), True, act_cat_sports.id),
        ("Science Olympiad Participation", "science-olympiad", "Students from Classes IX and X participated in the Regional Science Olympiad. The experience gave students exposure to competitive problem-solving at a high level.", today - timedelta(days=60), True, act_cat_academic.id),
        ("Annual Day Celebrations", "annual-day", "The Annual Day was a vibrant celebration of student talent in music, dance, drama, and arts. The event was attended by parents, staff, and distinguished guests.", today - timedelta(days=90), True, act_cat_cultural.id),
        ("Community Cleanliness Drive", "cleanliness-drive", "Students from the College section organised a community cleanliness drive in the local neighbourhood, reflecting our institution's commitment to social responsibility.", today - timedelta(days=45), True, act_cat_community.id),
    ]
    for title, slug, desc, act_date, is_pub, cat_id in activities:
        await get_or_create(
            db,
            Activity,
            defaults={"title": title, "description": desc, "activity_date": act_date, "is_published": is_pub, "category_id": cat_id},
            slug=slug,
        )

    # -----------------------------------------------------------------------
    # Gallery Album
    # -----------------------------------------------------------------------
    await get_or_create(
        db,
        GalleryAlbum,
        defaults={
            "title": "Campus & Facilities",
            "description": "Photographs of our campus, classrooms, laboratories, library, and sports facilities.",
            "category": "Campus",
            "is_published": True,
        },
        slug="campus-facilities",
    )

    # -----------------------------------------------------------------------
    # Admission Info
    # -----------------------------------------------------------------------
    for section_slug in ["nursery", "primary", "high-school", "college", "general"]:
        await get_or_create(
            db,
            AdmissionInfo,
            defaults={
                "overview": f"Admissions to {section_slug.replace('-', ' ').title()} are open for the upcoming academic session. We follow a transparent, merit-based admission process. Prospectus and application forms are available at the school office and through this website.",
                "eligibility": "Eligibility criteria and age requirements will be communicated on request.",
                "process": "1. Collect the prospectus from the school office or download it here.\n2. Submit the completed application form with required documents.\n3. Attend the interaction/assessment session (for applicable classes).\n4. Admission confirmation and fee payment.",
                "important_dates": "[Important dates to be updated by the Admissions Office]",
                "documents_required": "• Birth Certificate\n• Transfer Certificate from previous school (if applicable)\n• Mark sheets / Report cards from previous class\n• Recent passport-size photographs (4)\n• Address proof\n• Medical fitness certificate",
                "contact_info": "Admissions Office\nTelephone: [Admissions Phone]\nEmail: [admissions@example.com]\nOffice hours: 9:00 AM – 3:00 PM (Monday to Saturday)",
            },
            section_slug=section_slug,
        )

    await db.commit()
    print("✅ Seed data committed successfully.")
    print(f"\n📋 Admin email: {admin_email}")
    print("   Password: [check SEED_ADMIN_PASSWORD in your .env — not printed for security]")
    print("\n⚠️  IMPORTANT: Change the admin password immediately after first login.")


async def main() -> None:
    env = getattr(settings, "ENVIRONMENT", "development")
    if str(env).lower() in ("production", "prod"):
        raise RuntimeError(
            "seed.py cannot be run in a production environment. "
            "Set ENVIRONMENT to 'development' or 'staging' if this is intentional."
        )

    kwargs = {"echo": False}
    if not settings.DATABASE_URL.startswith("sqlite"):
        kwargs.update(pool_size=5, max_overflow=10)
    engine = create_async_engine(settings.DATABASE_URL, **kwargs)

    # Ensure all tables exist
    async with engine.begin() as conn:
        print("🔨 Ensuring database tables exist...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tables initialized.")

    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
