import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/common/SectionTitle";
import { CircularCard } from "@/components/common/CircularCard";
import { EmptyState } from "@/components/common/StateComponents";
import { api } from "@/lib/api";
import type { Circular } from "@/types";

async function getLatestCirculars(): Promise<Circular[]> {
  try {
    return await api.circulars.list({ page: 1 });
  } catch {
    return [];
  }
}

export async function CircularsPreview() {
  const circulars = (await getLatestCirculars()).slice(0, 4);

  return (
    <section className="section bg-neutral-50" aria-labelledby="circulars-heading">
      <div className="container-site">
        <div className="flex items-end justify-between mb-8 gap-4">
          <SectionTitle
            eyebrow="Circulars & Notices"
            title="Latest Announcements"
            id="circulars-heading"
          />
          <Link href="/circulars" className="btn-ghost btn-sm flex-shrink-0 hidden sm:inline-flex">
            View All
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {circulars.length === 0 ? (
          <EmptyState title="No circulars available" description="Official circulars and notices will appear here." />
        ) : (
          <div className="space-y-3">
            {circulars.map((circular) => (
              <CircularCard key={circular.id} circular={circular} />
            ))}
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link href="/circulars" className="btn-secondary w-full justify-center">
            View All Circulars
          </Link>
        </div>
      </div>
    </section>
  );
}
