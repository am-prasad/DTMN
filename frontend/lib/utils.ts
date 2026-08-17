import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isAfter } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, formatStr = "d MMMM yyyy"): string {
  try {
    return format(parseISO(dateStr), formatStr);
  } catch {
    return dateStr;
  }
}

export function isUpcoming(dateStr: string): boolean {
  try {
    return isAfter(parseISO(dateStr), new Date());
  } catch {
    return false;
  }
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

export function categoryBadgeClass(category: string): string {
  const map: Record<string, string> = {
    academic: "badge-blue",
    admissions: "badge-green",
    examination: "badge-amber",
    holidays: "badge-amber",
    events: "badge-blue",
    general: "badge-gray",
    administration: "badge-gray",
    sports: "badge-green",
    cultural: "badge-blue",
    community: "badge-green",
  };
  return map[category?.toLowerCase()] || "badge-gray";
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
