import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { SectionTitle } from "@/components/common/SectionTitle";
import { EmptyState } from "@/components/common/StateComponents";
import { api, getImageUrl } from "@/lib/api";
import { formatDate, categoryBadgeClass, cn } from "@/lib/utils";
import type { Activity } from "@/types";

async function getRecentActivities(): Promise<Activity[]> {
  try {
    return await api.activities.list({ page_size: 3 } as { page_size: number });
  } catch {
    return [];
  }
}

export async function ActivitiesPreview() {
  const activities = await getRecentActivities();

  return (
    <section className="section bg-white" aria-labelledby="activities-heading">
      <div className="container-site">
        <div className="flex items-end justify-between mb-8 gap-4">
          <SectionTitle
            eyebrow="Activities"
            title="Student Life"
            subtitle="From sports and cultural events to academic competitions and community initiatives."
            id="activities-heading"
          />
          <Link href="/activities" className="btn-ghost btn-sm flex-shrink-0 hidden sm:inline-flex">
            View All
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {activities.length === 0 ? (
          <EmptyState title="No activities published yet" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activities.map((activity) => {
              const firstImage = activity.images?.[0];
              const imgUrl = getImageUrl(firstImage?.image_path);
              return (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.slug}`}
                  className="card-hover group"
                  aria-label={activity.title}
                >
                  <div className="relative h-44 bg-neutral-100 overflow-hidden">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={activity.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
                        <Calendar className="h-8 w-8 text-primary-200" />
                      </div>
                    )}
                    {activity.category && (
                      <div className="absolute top-3 left-3">
                        <span className={cn("badge", categoryBadgeClass(activity.category.slug))}>
                          {activity.category.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {activity.title}
                    </h3>
                    {activity.activity_date && (
                      <p className="text-xs text-neutral-500 mt-1.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(activity.activity_date)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
