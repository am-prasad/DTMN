import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { EventCard } from "@/components/common/EventCard";
import { EmptyState } from "@/components/common/StateComponents";
import { api } from "@/lib/api";
import type { EventListItem } from "@/types";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past events at D T M N. Academic, cultural, and sports events.",
};

async function getUpcoming(): Promise<EventListItem[]> {
  try { return await api.events.list({ upcoming: true, page_size: 12 }); } catch { return []; }
}
async function getPast(): Promise<EventListItem[]> {
  try { return await api.events.list({ past: true, page_size: 9 }); } catch { return []; }
}

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcoming(), getPast()]);

  return (
    <>
      <PageHeader title="Events" description="Academic, cultural, sports, and community events." breadcrumbs={[{ label: "Events" }]} />

      <div className="section bg-white">
        <div className="container-site">
          {/* Upcoming */}
          <section className="mb-14" aria-labelledby="upcoming-events">
            <h2 id="upcoming-events" className="section-title mb-6">Upcoming Events</h2>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming events at the moment" description="Check back soon." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section aria-labelledby="past-events">
              <h2 id="past-events" className="section-title mb-6">Past Events</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {past.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
