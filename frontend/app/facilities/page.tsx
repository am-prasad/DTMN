import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/StateComponents";
import { api } from "@/lib/api";
import type { Facility } from "@/types";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Explore the facilities at [Institution Name]: classrooms, laboratories, library, sports grounds, and more.",
};

async function getFacilities(): Promise<Facility[]> {
  try {
    return await api.facilities.list();
  } catch {
    return [];
  }
}

export default async function FacilitiesPage() {
  const facilities = await getFacilities();

  return (
    <>
      <PageHeader
        title="Facilities"
        description="Our campus is equipped with the facilities necessary to support quality learning, sports, and cultural activities."
        breadcrumbs={[{ label: "Facilities" }]}
      />

      <div className="section bg-white">
        <div className="container-site">
          {facilities.length === 0 ? (
            <EmptyState title="Facilities information is being updated" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {facilities.map((facility) => (
                <article key={facility.id} className="card p-5">
                  <div className="w-10 h-10 rounded bg-primary-50 flex items-center justify-center mb-3">
                    {/* Icon name stored in DB — rendered as text fallback */}
                    <span className="text-primary text-xs font-bold">
                      {facility.name[0]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900">{facility.name}</h3>
                  {facility.category && (
                    <span className="text-xs text-neutral-400 mt-0.5 block">{facility.category}</span>
                  )}
                  {facility.description && (
                    <p className="text-sm text-neutral-600 mt-2 leading-relaxed line-clamp-3">
                      {facility.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
