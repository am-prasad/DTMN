import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/common/SectionTitle";

const SECTIONS = [
  {
    href: "/nursery",
    name: "Nursery",
    description:
      "Play-based early childhood education in a warm, nurturing environment. Developing foundational skills in cognitive, social, and emotional growth.",
    programs: "Play Group · Nursery · LKG · UKG",
    color: "border-l-4 border-amber-400",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
  },
  {
    href: "/primary",
    name: "Primary School",
    description:
      "Structured academic development from Classes I to V. Building literacy, numeracy, scientific thinking, and a love of learning.",
    programs: "Classes I – V",
    color: "border-l-4 border-blue-400",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    href: "/high-school",
    name: "High School",
    description:
      "Comprehensive secondary education from Classes VI to X. Academic rigour, board examination preparation, and personal development.",
    programs: "Classes VI – X",
    color: "border-l-4 border-green-500",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-800",
  },
  {
    href: "/college",
    name: "College",
    description:
      "Higher secondary programmes in Science, Commerce, and Arts streams. Preparing students for university and professional careers.",
    programs: "Science · Commerce · Arts",
    color: "border-l-4 border-purple-500",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
  },
];

export function AcademicSections() {
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
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`card-hover ${section.color} flex flex-col group`}
            >
              <div className={`${section.bg} px-5 pt-5 pb-4`}>
                <span className={`badge ${section.badge} mb-3 inline-block`}>
                  {section.programs}
                </span>
                <h3 className="font-bold text-lg text-neutral-900 group-hover:text-primary transition-colors">
                  {section.name}
                </h3>
              </div>
              <div className="px-5 py-4 flex-1 flex flex-col justify-between">
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {section.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
