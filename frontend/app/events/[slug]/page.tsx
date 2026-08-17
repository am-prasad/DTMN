import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { api, getImageUrl } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const event = await api.events.get(params.slug);
    return { title: event.title, description: event.description?.slice(0, 160) };
  } catch {
    return { title: "Event Not Found" };
  }
}

export default async function EventDetailPage({ params }: Props) {
  let event: Event;
  try {
    event = await api.events.get(params.slug);
  } catch {
    notFound();
  }

  const coverUrl = getImageUrl(event.cover_image);
  const isUpcoming = new Date(event.event_date) >= new Date();

  return (
    <>
      <PageHeader
        title={event.title}
        breadcrumbs={[{ label: "Events", href: "/events" }, { label: event.title }]}
      />

      <div className="section bg-white">
        <div className="container-site max-w-4xl">
          {/* Cover image */}
          {coverUrl && (
            <div className="relative h-64 sm:h-80 rounded-card overflow-hidden mb-8">
              <Image src={coverUrl} alt={event.title} fill className="object-cover" sizes="100vw" priority />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {event.category && (
                  <span className="badge badge-blue">{event.category.name}</span>
                )}
                <span className={`badge ${isUpcoming ? "badge-green" : "badge-gray"}`}>
                  {isUpcoming ? "Upcoming" : "Past Event"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{event.title}</h1>

              {event.description && (
                <div className="mt-6 text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              )}

              {/* Additional images */}
              {event.images && event.images.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-semibold text-neutral-900 mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {event.images.map((img) => {
                      const url = getImageUrl(img.image_path);
                      return url ? (
                        <div key={img.id} className="relative h-32 rounded overflow-hidden bg-neutral-100">
                          <Image src={url} alt={img.caption || ""} fill className="object-cover" sizes="33vw" />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside>
              <div className="card p-5 space-y-4 sticky top-24">
                <h2 className="font-semibold text-neutral-900 text-sm uppercase tracking-wider">Event Details</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2.5 text-neutral-700">
                    <Calendar className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">{formatDate(event.event_date)}</div>
                    </div>
                  </div>
                  {event.start_time && (
                    <div className="flex items-start gap-2.5 text-neutral-700">
                      <Clock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{event.start_time}{event.end_time && ` – ${event.end_time}`}</span>
                    </div>
                  )}
                  {event.venue && (
                    <div className="flex items-start gap-2.5 text-neutral-700">
                      <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                </div>
                {event.registration_url && isUpcoming && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-accent w-full justify-center mt-2"
                  >
                    Register / Learn More
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
