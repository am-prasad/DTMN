import Link from "next/link";
import { FileText, Download, Calendar } from "lucide-react";
import { formatDate, cn, categoryBadgeClass } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Circular } from "@/types";

interface CircularCardProps {
  circular: Circular;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  admissions: "Admissions",
  examination: "Examination",
  holidays: "Holidays",
  events: "Events",
  academic: "Academic",
  administration: "Administration",
};

export function CircularCard({ circular, className }: CircularCardProps) {
  return (
    <article
      className={cn(
        "card flex gap-4 p-4 items-start transition-shadow hover:shadow-card-hover",
        className
      )}
      aria-label={`Circular: ${circular.title}`}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <FileText className="h-5 w-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={cn("badge", categoryBadgeClass(circular.category))}>
            {CATEGORY_LABELS[circular.category] || circular.category}
          </span>
          {circular.published_at && (
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(circular.published_at, "d MMM yyyy")}
            </span>
          )}
        </div>
        <h3 className="font-medium text-neutral-900 text-sm leading-snug line-clamp-2">
          {circular.title}
        </h3>
        {circular.description && (
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{circular.description}</p>
        )}
      </div>

      {/* Download button */}
      {circular.attachment_path && (
        <a
          href={api.circulars.downloadUrl(circular.id)}
          download={circular.attachment_filename || "circular.pdf"}
          className="btn-ghost btn-sm flex-shrink-0"
          aria-label={`Download ${circular.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </a>
      )}
    </article>
  );
}
