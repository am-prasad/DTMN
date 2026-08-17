import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { api, getImageUrl } from "@/lib/api";
import { formatDate, cn, categoryBadgeClass } from "@/lib/utils";
import type { Activity } from "@/types";

interface Props { params: { slug: string } }

async function getActivities() {
  try { return await api.activities.list({ page_size: 20 } as { page_size: number }); } catch { return []; }
}
async function getActivity(slug: string): Promise<Activity | null> {
  try { return await api.activities.get(slug); } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const activity = await getActivity(params.slug);
  return activity
    ? { title: activity.title, description: activity.description?.slice(0, 160) }
    : { title: "Activity Not Found" };
}

export default async function ActivityDetailPage({ params }: Props) {
  const activity = await getActivity(params.slug);
  if (!activity) notFound();

  const firstImage = activity.images?.[0];
  const coverUrl = getImageUrl(firstImage?.image_path);

  return (
    <>
      <PageHeader
        title={activity.title}
        breadcrumbs={[{ label: "Activities", href: "/activities" }, { label: activity.title }]}
      />

      <div className="section bg-white">
        <div className="container-site max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {activity.category && (
              <span className={cn("badge", categoryBadgeClass(activity.category.slug))}>
                {activity.category.name}
              </span>
            )}
            {activity.activity_date && (
              <span className="text-sm text-neutral-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(activity.activity_date)}
              </span>
            )}
          </div>

          {coverUrl && (
            <div className="relative h-64 sm:h-80 rounded-card overflow-hidden mb-8">
              <Image src={coverUrl} alt={activity.title} fill className="object-cover" sizes="100vw" priority />
            </div>
          )}

          {activity.description && (
            <div className="text-neutral-700 leading-relaxed whitespace-pre-wrap mb-8">
              {activity.description}
            </div>
          )}

          {activity.video_url && (
            <div className="mb-8">
              <h2 className="font-semibold text-neutral-900 mb-3">Video</h2>
              <div className="aspect-video rounded-card overflow-hidden bg-neutral-100">
                <iframe
                  src={activity.video_url.replace("watch?v=", "embed/")}
                  title={activity.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {activity.images && activity.images.length > 1 && (
            <div>
              <h2 className="font-semibold text-neutral-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activity.images.map((img) => {
                  const url = getImageUrl(img.image_path);
                  return url ? (
                    <div key={img.id} className="relative h-36 rounded overflow-hidden bg-neutral-100">
                      <Image src={url} alt={img.caption || activity.title} fill className="object-cover" sizes="33vw" />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="mt-10">
            <Link href="/activities" className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
              Back to Activities
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
