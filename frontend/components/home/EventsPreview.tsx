import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { SectionTitle } from "@/components/common/SectionTitle";
import { EventCard } from "@/components/common/EventCard";
import { EmptyState } from "@/components/common/StateComponents";
import { api } from "@/lib/api";
import type { EventListItem } from "@/types";

async function getUpcomingEvents(): Promise<EventListItem[]> {
  try {
    return await api.events.list({ upcoming: true, page_size: 3 });
  } catch {
    return [];
  }
}

export async function EventsPreview() {
  const events = await getUpcomingEvents();

  return (
    <section className="section bg-white" aria-labelledby="events-heading">
      <div className="container-site">
        <div className="flex items-end justify-between mb-8 gap-4">
          <SectionTitle
            eyebrow="Events"
            title="Upcoming Events"
            id="events-heading"
          />
          <Link href="/events" className="btn-ghost btn-sm flex-shrink-0 hidden sm:inline-flex">
            View All
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            description="Check back soon for upcoming events and activities."
            icon={<Calendar className="h-10 w-10" />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-7 text-center sm:hidden">
          <Link href="/events" className="btn-secondary">
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
}
