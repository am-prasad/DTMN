import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import { formatDate, cn, categoryBadgeClass } from "@/lib/utils";
import { getImageUrl } from "@/lib/api";
import type { EventListItem } from "@/types";

interface EventCardProps {
  event: EventListItem;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const imageUrl = getImageUrl(event.cover_image);
  const isUpcoming = new Date(event.event_date) >= new Date();

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn("card-hover flex flex-col group focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 rounded-card", className)}
      aria-label={`${event.title}, ${formatDate(event.event_date)}`}
    >
      {/* Image */}
      <div className="relative h-44 bg-neutral-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
            <Calendar className="h-8 w-8 text-primary-200" />
          </div>
        )}
        {/* Upcoming badge */}
        <div className="absolute top-3 left-3">
          <span className={cn("badge", isUpcoming ? "badge-green" : "badge-gray")}>
            {isUpcoming ? "Upcoming" : "Past"}
          </span>
        </div>
        {event.category && (
          <div className="absolute top-3 right-3">
            <span className={cn("badge", categoryBadgeClass(event.category.slug))}>
              {event.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-neutral-900 text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>
        <div className="mt-3 space-y-1.5 text-sm text-neutral-500 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{event.start_time}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
