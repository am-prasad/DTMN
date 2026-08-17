"""
Database seed script.

Creates clearly fictional demo data so the website can be tested immediately.
All content is marked as placeholder and should be replaced before go-live.

Run:
    cd backend
    python seed.py
"""
from __future__ import annotations

import asyncio
import json
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.security import hash_password
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


async def seed(db: AsyncSession) -> None:
    print("🌱 Seeding database with demo data...")

    # -----------------------------------------------------------------------
    # Super Admin user
    # -----------------------------------------------------------------------
    admin = User(
        email=settings.SEED_ADMIN_EMAIL,
        hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD or "Admin@1234!Temp"),
        full_name="[Administrator Name]",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        must_change_password=True,
    )
    db.add(admin)
    await db.flush()
    print(f"✅ Super Admin created: {settings.SEED_ADMIN_EMAIL}")
    print("⚠️  Default password — CHANGE IMMEDIATELY after first login.")

    # -----------------------------------------------------------------------
    # Site Content
    # -----------------------------------------------------------------------
    content_items = [
        ("institution_name", "[Institution Name]", "text", "Institution Name", "general"),
        ("institution_tagline", "[Inspiring Minds, Building Futures]", "text", "Tagline", "general"),
        ("institution_intro", "[Institution Name] has been dedicated to quality education since [Year]. We are committed to nurturing well-rounded individuals through academic excellence, character development, and holistic growth.", "text", "Homepage Introduction", "homepage"),
        ("institution_address", "[Full Address]\n[City, State - PIN Code]", "text", "Address", "contact"),
        ("institution_phone", "[Phone Number]", "text", "Main Phone", "contact"),
        ("institution_email", "[info@example.com]", "text", "Main Email", "contact"),
        ("institution_office_hours", "Monday – Friday: 9:00 AM – 4:00 PM\nSaturday: 9:00 AM – 1:00 PM", "text", "Office Hours", "contact"),
        ("admission_contact_email", "[admissions@example.com]", "text", "Admissions Email", "contact"),
        ("admission_contact_phone", "[Admissions Phone]", "text", "Admissions Phone", "contact"),
        ("about_history", "[Institution Name] was established in [Year] with a vision to provide quality education to the community. Over the decades, we have grown from a small school to a comprehensive educational institution covering Nursery through College.", "text", "Institution History", "about"),
        ("about_vision", "To be a premier institution that nurtures curious, compassionate, and capable individuals prepared for an ever-changing world.", "text", "Vision", "about"),
        ("about_mission", "To provide a supportive, stimulating, and inclusive learning environment that develops the intellectual, creative, social, and ethical potential of every student.", "text", "Mission", "about"),
        ("about_values", "Academic Excellence | Integrity | Inclusivity | Respect | Lifelong Learning", "text", "Values", "about"),
        ("principal_name", "[Principal Name]", "text", "Principal Name", "about"),
        ("principal_designation", "Principal", "text", "Principal Designation", "about"),
        ("principal_message", "Dear Students, Parents, and Well-wishers,\n\nWelcome to [Institution Name]. It is my privilege to lead this institution, and I am deeply proud of our community's commitment to educational excellence and holistic development. We believe that every student possesses unique potential, and it is our responsibility to help each one discover and develop it.\n\n[Principal Name]", "text", "Principal's Message", "about"),
        ("footer_tagline", "Inspiring minds since [Year].", "text", "Footer Tagline", "footer"),
        ("social_facebook", "", "text", "Facebook URL", "social"),
        ("social_twitter", "", "text", "Twitter/X URL", "social"),
        ("social_instagram", "", "text", "Instagram URL", "social"),
        ("social_youtube", "", "text", "YouTube URL", "social"),
    ]
    for key, value, ctype, label, group in content_items:
        db.add(SiteContent(key=key, value=value, content_type=ctype, label=label, group=group))

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
        db.add(AcademicSection(**s))

    # -----------------------------------------------------------------------
    # Departments & Faculty
    # -----------------------------------------------------------------------
    depts = [
        Department(name="Science", section=AcademicSectionSlug.HIGH_SCHOOL),
        Department(name="Mathematics", section=AcademicSectionSlug.HIGH_SCHOOL),
        Department(name="Languages", section=AcademicSectionSlug.HIGH_SCHOOL),
        Department(name="Social Studies", section=AcademicSectionSlug.HIGH_SCHOOL),
        Department(name="Commerce", section=AcademicSectionSlug.COLLEGE),
        Department(name="Arts & Humanities", section=AcademicSectionSlug.COLLEGE),
    ]
    for d in depts:
        db.add(d)
    await db.flush()

    faculty_members = [
        Faculty(name="[Faculty Member A]", designation="Senior Teacher", qualification="M.Sc. Physics, B.Ed.", experience_years=12, bio="[Faculty Member A] has been teaching Physics at [Institution Name] for over a decade. Known for making complex concepts accessible to students.", section=AcademicSectionSlug.HIGH_SCHOOL, department_id=depts[0].id, sort_order=1),
        Faculty(name="[Faculty Member B]", designation="Mathematics Teacher", qualification="M.Sc. Mathematics, B.Ed.", experience_years=8, bio="[Faculty Member B] specialises in making mathematics intuitive and engaging for students of all abilities.", section=AcademicSectionSlug.HIGH_SCHOOL, department_id=depts[1].id, sort_order=2),
        Faculty(name="[Faculty Member C]", designation="English Teacher", qualification="M.A. English Literature, B.Ed.", experience_years=10, bio="[Faculty Member C] brings literature to life in the classroom, fostering a love of reading and strong writing skills.", section=AcademicSectionSlug.HIGH_SCHOOL, department_id=depts[2].id, sort_order=3),
        Faculty(name="[Faculty Member D]", designation="Commerce Lecturer", qualification="M.Com., B.Ed.", experience_years=6, bio="[Faculty Member D] guides College Commerce students through Accountancy and Business Studies with a practical, industry-oriented approach.", section=AcademicSectionSlug.COLLEGE, department_id=depts[4].id, sort_order=1),
        Faculty(name="[Faculty Member E]", designation="Class Teacher – Nursery", qualification="B.Ed. (Early Childhood Education)", experience_years=5, bio="[Faculty Member E] creates a warm and stimulating environment where Nursery children develop confidence through play and structured activities.", section=AcademicSectionSlug.NURSERY, sort_order=1),
        Faculty(name="[Faculty Member F]", designation="Class Teacher – Primary IV", qualification="B.Sc., B.Ed.", experience_years=7, bio="[Faculty Member F] is dedicated to building strong academic foundations with an emphasis on curiosity and independent thinking.", section=AcademicSectionSlug.PRIMARY, sort_order=1),
    ]
    for f in faculty_members:
        db.add(f)

    # -----------------------------------------------------------------------
    # Facilities
    # -----------------------------------------------------------------------
    facilities = [
        Facility(name="Classrooms", description="Spacious, well-ventilated classrooms with natural lighting and modern teaching aids across all sections.", category="Academic", icon="Building2", sort_order=1),
        Facility(name="Science Laboratories", description="Fully equipped Physics, Chemistry, and Biology laboratories for hands-on experimentation and learning.", category="Academic", icon="FlaskConical", sort_order=2),
        Facility(name="Library", description="A well-stocked library with an extensive collection of textbooks, reference materials, and fiction for all age groups.", category="Academic", icon="BookOpen", sort_order=3),
        Facility(name="Computer Laboratory", description="Modern computer facilities with internet access, supporting digital literacy and programming education.", category="Technology", icon="Monitor", sort_order=4),
        Facility(name="Sports Facilities", description="Facilities for cricket, football, basketball, badminton, athletics, and indoor games, supervised by qualified sports instructors.", category="Sports", icon="Trophy", sort_order=5),
        Facility(name="Auditorium", description="A spacious auditorium used for cultural events, seminars, debates, and school functions.", category="Events", icon="Theater", sort_order=6),
        Facility(name="Transport", description="A fleet of school buses covering key routes across the city, with trained drivers and attendants.", category="Transport", icon="Bus", sort_order=7),
        Facility(name="Medical Room", description="A medical room staffed by a qualified nurse, with first-aid facilities and emergency protocols in place.", category="Welfare", icon="HeartPulse", sort_order=8),
    ]
    for f in facilities:
        db.add(f)

    # -----------------------------------------------------------------------
    # Event Categories + Events
    # -----------------------------------------------------------------------
    cat_academic = EventCategory(name="Academic", slug="academic")
    cat_sports = EventCategory(name="Sports", slug="sports")
    cat_cultural = EventCategory(name="Cultural", slug="cultural")
    cat_general = EventCategory(name="General", slug="general")
    for c in [cat_academic, cat_sports, cat_cultural, cat_general]:
        db.add(c)
    await db.flush()

    today = date.today()
    events = [
        Event(title="Annual Sports Day", slug="annual-sports-day", description="[Institution Name]'s Annual Sports Day celebrates athletic achievement and sportsmanship across all sections. Students compete in track and field events, team sports, and fun activities.", event_date=today + timedelta(days=14), start_time=None, venue="School Grounds", is_published=True, category_id=cat_sports.id),
        Event(title="Science Exhibition [Year]", slug="science-exhibition", description="Our annual Science Exhibition showcases student projects from Classes VIII to XII. Open to parents and visitors. Exhibition includes live demonstrations and judged project competition.", event_date=today + timedelta(days=28), venue="School Auditorium", is_published=True, category_id=cat_academic.id),
        Event(title="Cultural Evening", slug="cultural-evening", description="A celebration of art, music, dance, and drama performed by students from all sections. A cherished annual event that brings together the entire school community.", event_date=today + timedelta(days=45), venue="School Auditorium", is_published=True, category_id=cat_cultural.id),
        Event(title="Parent-Teacher Meeting – Term I", slug="ptm-term-1", description="An opportunity for parents to meet their child's teachers, discuss academic progress, and address individual needs.", event_date=today + timedelta(days=7), venue="Respective Classrooms", is_published=True, category_id=cat_general.id),
    ]
    for e in events:
        db.add(e)

    # -----------------------------------------------------------------------
    # Circulars
    # -----------------------------------------------------------------------
    circulars = [
        Circular(title="Academic Calendar [Year]", slug="academic-calendar", description="Please find attached the Academic Calendar for the current session. All examinations, holidays, and events are listed.", category=CircularCategory.ACADEMIC, is_published=True, published_at=today),
        Circular(title="Summer Vacation Notice", slug="summer-vacation-notice", description="School will remain closed for Summer Vacation from [Date] to [Date]. Classes resume on [Date]. Please ensure children complete their holiday assignments.", category=CircularCategory.HOLIDAYS, is_published=True, published_at=today - timedelta(days=5)),
        Circular(title="Admission Open – [Academic Year]", slug="admissions-open", description="Admissions are now open for the upcoming academic session across all sections – Nursery, Primary, High School, and College. Interested parents are invited to collect the prospectus from the school office or apply online.", category=CircularCategory.ADMISSIONS, is_published=True, published_at=today - timedelta(days=10)),
        Circular(title="Term I Examination Schedule", slug="term-1-examination-schedule", description="The examination schedule for Term I has been finalised. Students are advised to prepare accordingly. Any queries may be directed to the respective class teachers.", category=CircularCategory.EXAMINATION, is_published=True, published_at=today - timedelta(days=3)),
    ]
    for c in circulars:
        db.add(c)

    # -----------------------------------------------------------------------
    # Activity Categories + Activities
    # -----------------------------------------------------------------------
    act_cat_sports = ActivityCategory(name="Sports", slug="sports")
    act_cat_cultural = ActivityCategory(name="Cultural", slug="cultural")
    act_cat_academic = ActivityCategory(name="Academic", slug="academic")
    act_cat_community = ActivityCategory(name="Community", slug="community")
    for a in [act_cat_sports, act_cat_cultural, act_cat_academic, act_cat_community]:
        db.add(a)
    await db.flush()

    activities = [
        Activity(title="Inter-School Cricket Tournament", slug="cricket-tournament", description="Our cricket team participated in the Inter-School Cricket Tournament and demonstrated outstanding sportsmanship and team spirit.", activity_date=today - timedelta(days=30), is_published=True, category_id=act_cat_sports.id),
        Activity(title="Science Olympiad Participation", slug="science-olympiad", description="Students from Classes IX and X participated in the Regional Science Olympiad. The experience gave students exposure to competitive problem-solving at a high level.", activity_date=today - timedelta(days=60), is_published=True, category_id=act_cat_academic.id),
        Activity(title="Annual Day Celebrations", slug="annual-day", description="The Annual Day was a vibrant celebration of student talent in music, dance, drama, and arts. The event was attended by parents, staff, and distinguished guests.", activity_date=today - timedelta(days=90), is_published=True, category_id=act_cat_cultural.id),
        Activity(title="Community Cleanliness Drive", slug="cleanliness-drive", description="Students from the College section organised a community cleanliness drive in the local neighbourhood, reflecting our institution's commitment to social responsibility.", activity_date=today - timedelta(days=45), is_published=True, category_id=act_cat_community.id),
    ]
    for a in activities:
        db.add(a)

    # -----------------------------------------------------------------------
    # Gallery Album
    # -----------------------------------------------------------------------
    album = GalleryAlbum(title="Campus & Facilities", slug="campus-facilities", description="Photographs of our campus, classrooms, laboratories, library, and sports facilities.", category="Campus", is_published=True)
    db.add(album)

    # -----------------------------------------------------------------------
    # Admission Info
    # -----------------------------------------------------------------------
    for section_slug in ["nursery", "primary", "high-school", "college", "general"]:
        db.add(AdmissionInfo(
            section_slug=section_slug,
            overview=f"Admissions to {section_slug.replace('-', ' ').title()} are open for the upcoming academic session. We follow a transparent, merit-based admission process. Prospectus and application forms are available at the school office and through this website.",
            eligibility="Eligibility criteria and age requirements will be communicated on request.",
            process="1. Collect the prospectus from the school office or download it here.\n2. Submit the completed application form with required documents.\n3. Attend the interaction/assessment session (for applicable classes).\n4. Admission confirmation and fee payment.",
            important_dates="[Important dates to be updated by the Admissions Office]",
            documents_required="• Birth Certificate\n• Transfer Certificate from previous school (if applicable)\n• Mark sheets / Report cards from previous class\n• Recent passport-size photographs (4)\n• Address proof\n• Medical fitness certificate",
            contact_info="Admissions Office\nTelephone: [Admissions Phone]\nEmail: [admissions@example.com]\nOffice hours: 9:00 AM – 3:00 PM (Monday to Saturday)",
        ))

    await db.commit()
    print("✅ Seed data committed successfully.")
    print("\n📋 Demo credentials:")
    print(f"   Email: {settings.SEED_ADMIN_EMAIL}")
    print(f"   Password: {settings.SEED_ADMIN_PASSWORD or 'Admin@1234!Temp'}")
    print("\n⚠️  IMPORTANT: Change the admin password immediately after first login.")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
