import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { CircularCard } from "@/components/common/CircularCard";
import { EmptyState } from "@/components/common/StateComponents";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Circulars & Notices",
  description: "Official circulars, notices, and announcements from [Institution Name]. Download official documents.",
};

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "general", label: "General" },
  { value: "admissions", label: "Admissions" },
  { value: "examination", label: "Examination" },
  { value: "holidays", label: "Holidays" },
  { value: "academic", label: "Academic" },
  { value: "administration", label: "Administration" },
];

async function getCirculars(category?: string) {
  try {
    return await api.circulars.list({ category, page: 1 });
  } catch {
    return [];
  }
}

export default async function CircularsPage() {
  const circulars = await getCirculars();

  return (
    <>
      <PageHeader
        title="Circulars & Notices"
        description="Official announcements, notices, and downloadable circulars."
        breadcrumbs={[{ label: "Circulars" }]}
      />

      <div className="section bg-white">
        <div className="container-site max-w-3xl">
          {circulars.length === 0 ? (
            <EmptyState title="No circulars published yet" description="Official circulars will appear here." />
          ) : (
            <div className="space-y-3">
              {circulars.map((c) => (
                <CircularCard key={c.id} circular={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
