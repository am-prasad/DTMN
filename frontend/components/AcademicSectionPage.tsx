import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { FacultyCard } from "@/components/common/FacultyCard";
import { EmptyState } from "@/components/common/StateComponents";
import { api } from "@/lib/api";
import type { AcademicSection, FacultyMember } from "@/types";

interface AcademicSectionPageProps {
  slug: string;
  label: string;
  breadcrumbLabel: string;
}

export async function AcademicSectionPage({ slug, label, breadcrumbLabel }: AcademicSectionPageProps) {
  let section: AcademicSection | null = null;
  let faculty: FacultyMember[] = [];

  try {
    section = await api.sections.get(slug);
  } catch {
    // Section content not yet populated — show placeholder
  }

  try {
    faculty = await api.faculty.list({ section: slug });
  } catch {
    faculty = [];
  }

  return (
    <>
      <PageHeader
        title={section?.name || label}
        description={section?.tagline || undefined}
        breadcrumbs={[{ label: "Academics", href: "/academics" }, { label: breadcrumbLabel }]}
      />

      <div className="section bg-white">
        <div className="container-site max-w-5xl">
          {/* Introduction */}
          {section?.description && (
            <section className="mb-12" aria-labelledby={`${slug}-intro`}>
              <h2 id={`${slug}-intro`} className="section-title">About {section.name}</h2>
              <div className="mt-4 text-neutral-600 leading-relaxed whitespace-pre-wrap max-w-3xl">
                {section.description}
              </div>
            </section>
          )}

          {/* Head/Principal Message */}
          {section?.head_message && (
            <section className="mb-12" aria-labelledby={`${slug}-head-msg`}>
              <h2 id={`${slug}-head-msg`} className="section-title">
                Message from the {section.head_designation || "Head"}
              </h2>
              <div className="mt-5 bg-neutral-50 border border-neutral-200 rounded-card p-7">
                <blockquote className="italic text-neutral-700 leading-relaxed border-l-4 border-accent-400 pl-5">
                  {section.head_message}
                </blockquote>
                {section.head_name && (
                  <footer className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold">
                      {section.head_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-neutral-900">{section.head_name}</div>
                      {section.head_designation && (
                        <div className="text-xs text-neutral-500">{section.head_designation}</div>
                      )}
                    </div>
                  </footer>
                )}
              </div>
            </section>
          )}

          {/* Programs */}
          {section?.programs && (
            <section className="mb-12" aria-labelledby={`${slug}-programs`}>
              <h2 id={`${slug}-programs`} className="section-title">Programmes & Classes</h2>
              <div className="mt-4 text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {section.programs}
              </div>
            </section>
          )}

          {/* Faculty */}
          {faculty.length > 0 && (
            <section className="mb-12" aria-labelledby={`${slug}-faculty`}>
              <h2 id={`${slug}-faculty`} className="section-title">Our Faculty</h2>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {faculty.slice(0, 8).map((f) => (
                  <FacultyCard key={f.id} faculty={f} />
                ))}
              </div>
            </section>
          )}

          {/* Placeholder notice */}
          {!section && (
            <div className="text-center py-16">
              <p className="text-sm text-neutral-400 italic">
                Section content has not been configured yet. 
                Please update this section in the admin dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
