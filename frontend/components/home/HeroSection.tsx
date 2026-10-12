import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getSiteContent } from "@/lib/site";

export async function HeroSection() {
  const content = await getSiteContent();

  const institutionName =
    content.institution_name && !content.institution_name.startsWith("[")
      ? content.institution_name
      : "D T M N Educational Institution";
  const tagline =
    content.institution_tagline && !content.institution_tagline.startsWith("[")
      ? content.institution_tagline
      : "Inspiring Minds, Building Futures";
  const intro =
    content.institution_intro && !content.institution_intro.startsWith("[")
      ? content.institution_intro
      : "Dedicated to quality education since 2001. We nurture students across Nursery, Primary, High School, and College — providing a supportive environment where every student can achieve their potential.";
  const establishedYear = content.established_year || "2001";

  return (
    <section
      className="relative bg-primary overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden="true"
      />

      <div className="container-site relative py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="h-4 w-4 text-accent-400" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-widest uppercase text-accent-400">
              Est. {establishedYear}
            </span>
          </div>

          {/* Heading */}
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight text-balance"
          >
            {institutionName}
          </h1>

          {/* Tagline */}
          <p className="mt-3 text-lg sm:text-xl text-blue-200 font-light leading-relaxed">
            {tagline}
          </p>

          {/* Introduction */}
          <p className="mt-5 text-base text-blue-100 leading-relaxed max-w-2xl">
            {intro}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admissions" className="btn-accent btn-lg">
              Apply for Admission
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/about"
              className="btn btn-lg bg-white/10 text-white border border-white/30 hover:bg-white/20"
            >
              Explore Our Institution
            </Link>
          </div>

          {/* Academic Sections Quick Links */}
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { href: "/nursery", label: "Nursery" },
              { href: "/primary", label: "Primary" },
              { href: "/high-school", label: "High School" },
              { href: "/college", label: "College" },
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="text-xs font-medium text-blue-200 hover:text-white border border-blue-400/30 hover:border-blue-300 rounded px-3 py-1.5 transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg
          viewBox="0 0 1440 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-10 fill-white"
        >
          <path d="M0 40L1440 40L1440 20C1200 40 960 0 720 0C480 0 240 40 0 20L0 40Z" />
        </svg>
      </div>
    </section>
  );
}
