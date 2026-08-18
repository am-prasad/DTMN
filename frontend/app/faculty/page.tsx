import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { FacultyCard } from "@/components/common/FacultyCard";
import { EmptyState } from "@/components/common/StateComponents";
import { api } from "@/lib/api";
import type { FacultyMember } from "@/types";

export const metadata: Metadata = {
  title: "Faculty",
  description: "Meet the dedicated teaching faculty of D T M N. Browse by academic section and department.",
};

const SECTIONS = [
  { slug: "nursery", label: "Nursery" },
  { slug: "primary", label: "Primary School" },
  { slug: "high-school", label: "High School" },
  { slug: "college", label: "College" },
];

async function getAllFaculty(): Promise<FacultyMember[]> {
  try {
    return await api.faculty.list({ page_size: 100 } as { page_size: number });
  } catch {
    return [];
  }
}

export default async function FacultyPage() {
  const allFaculty = await getAllFaculty();

  const grouped = SECTIONS.map((sec) => ({
    ...sec,
    faculty: allFaculty.filter((f) => f.section === sec.slug),
  }));

  return (
    <>
      <PageHeader
        title="Our Faculty"
        description="D T M N is fortunate to have a dedicated, qualified, and experienced teaching staff across all sections."
        breadcrumbs={[{ label: "Faculty" }]}
      />

      <div className="section bg-white">
        <div className="container-site">
          {grouped.every((g) => g.faculty.length === 0) && (
            <EmptyState title="Faculty directory is being updated" description="Please check back soon." />
          )}

          {grouped.map((group) =>
            group.faculty.length > 0 ? (
              <section key={group.slug} className="mb-14" aria-labelledby={`faculty-${group.slug}`}>
                <h2
                  id={`faculty-${group.slug}`}
                  className="section-title border-b border-neutral-200 pb-3 mb-6"
                >
                  {group.label}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {group.faculty.map((f) => (
                    <FacultyCard key={f.id} faculty={f} />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      </div>
    </>
  );
}
