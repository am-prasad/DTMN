import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/StateComponents";
import { api, getImageUrl } from "@/lib/api";
import { formatDate, cn, categoryBadgeClass } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Activities",
  description: "Sports, cultural events, academic activities, and more at D T M N.",
};

async function getActivities() {
  try { return await api.activities.list({ page_size: 20 } as { page_size: number }); } catch { return []; }
}

export default async function ActivitiesPage() {
  const activities = await getActivities();

  return (
    <>
      <PageHeader title="Activities" description="Sports, cultural events, competitions, workshops, and student initiatives." breadcrumbs={[{ label: "Activities" }]} />

      <div className="section bg-white">
        <div className="container-site">
          {activities.length === 0 ? (
            <EmptyState title="No activities published yet" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activities.map((a) => {
                const img = getImageUrl(a.images?.[0]?.image_path);
                return (
                  <Link key={a.id} href={`/activities/${a.slug}`} className="card-hover group">
                    <div className="relative h-44 bg-neutral-100 overflow-hidden">
                      {img ? (
                        <Image src={img} alt={a.title} fill sizes="33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><Calendar className="h-8 w-8 text-neutral-300" /></div>
                      )}
                      {a.category && <div className="absolute top-3 left-3"><span className={cn("badge", categoryBadgeClass(a.category.slug))}>{a.category.name}</span></div>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors line-clamp-2">{a.title}</h3>
                      {a.activity_date && <p className="text-xs text-neutral-500 mt-1.5">{formatDate(a.activity_date)}</p>}
                      {a.description && <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{a.description}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
