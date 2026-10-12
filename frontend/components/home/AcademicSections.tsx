import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/common/SectionTitle";
import { api } from "@/lib/api";

const SECTION_STYLES: Record<string, { color: string; bg: string; badge: string }> = {
  nursery: {
    color: "border-l-4 border-amber-400",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
  },
  primary: {
    color: "border-l-4 border-blue-400",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
  },
  "high-school": {
    color: "border-l-4 border-green-500",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-800",
  },
  college: {
    color: "border-l-4 border-purple-500",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
  },
};

const DEFAULT_SECTIONS = [
  {
    slug: "nursery",
    name: "Nursery",
    description:
      "Play-based early childhood education in a warm, nurturing environment. Developing foundational skills in cognitive, social, and emotional growth.",
    programs: "Play Group · Nursery · LKG · UKG",
  },
  {
    slug: "primary",
    name: "Primary School",
    description:
      "Structured academic development from Classes I to V. Building literacy, numeracy, scientific thinking, and a love of learning.",
    programs: "Classes I – V",
  },
  {
    slug: "high-school",
    name: "High School",
    description:
      "Comprehensive secondary education from Classes VI to X. Academic rigour, board examination preparation, and personal development.",
    programs: "Classes VI – X",
  },
  {
    slug: "college",
    name: "College",
    description:
      "Higher secondary programmes in Science, Commerce, and Arts streams. Preparing students for university and professional careers.",
    programs: "Science · Commerce · Arts",
  },
];

export async function AcademicSections() {
  let sections = DEFAULT_SECTIONS;
  try {
    const fetched = await api.sections.list();
    if (fetched && fetched.length > 0) {
      sections = fetched.map((s) => ({
        slug: s.slug,
        name: s.name,
        description: s.description || "",
        programs: s.programs || "",
      }));
    }
  } catch {}

  return (
    <section className="section bg-neutral-50" aria-labelledby="academics-heading">
      <div className="container-site">
        <SectionTitle
          eyebrow="Academics"
          title="Our Academic Sections"
          subtitle="A complete educational pathway from early childhood through higher secondary, under one institution."
          id="academics-heading"
        />

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sections.map((section) => {
            const style = SECTION_STYLES[section.slug] || {
              color: "border-l-4 border-primary",
              bg: "bg-neutral-50",
              badge: "bg-neutral-100 text-neutral-800",
            };
            return (
              <div
                key={section.slug}
                className={`card p-6 flex flex-col justify-between ${style.color} hover:shadow-card-hover transition-shadow`}
              >
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{section.name}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed line-clamp-3">
                    {section.description}
                  </p>
                  {section.programs && (
                    <div className="mt-4">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${style.badge}`}>
                        {section.programs}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <Link
                    href={`/${section.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-800 transition-colors"
                  >
                    Explore {section.name}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
