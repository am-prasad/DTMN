import Link from "next/link";
import {
  GraduationCap,
  Bell,
  CalendarDays,
  Phone,
  Download,
  Users,
} from "lucide-react";

const QUICK_LINKS = [
  {
    href: "/admissions",
    label: "Admissions",
    description: "Apply now",
    icon: GraduationCap,
    accent: true,
  },
  {
    href: "/circulars",
    label: "Circulars",
    description: "Notices & announcements",
    icon: Bell,
  },
  {
    href: "/events",
    label: "Events",
    description: "Upcoming events",
    icon: CalendarDays,
  },
  {
    href: "/faculty",
    label: "Faculty",
    description: "Our teaching staff",
    icon: Users,
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Get in touch",
    icon: Phone,
  },
  {
    href: "/circulars",
    label: "Downloads",
    description: "Documents & forms",
    icon: Download,
  },
];

export function QuickAccess() {
  return (
    <section
      className="bg-neutral-50 border-b border-neutral-200 py-8"
      aria-labelledby="quick-access-heading"
    >
      <div className="container-site">
        <h2 id="quick-access-heading" className="sr-only">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`flex flex-col items-center text-center p-3.5 rounded-card border transition-all duration-150 group
                  ${
                    link.accent
                      ? "bg-primary text-white border-primary hover:bg-primary-700"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-primary hover:text-primary"
                  }`}
              >
                <Icon
                  className={`h-6 w-6 mb-2 ${link.accent ? "text-accent-300" : "text-primary group-hover:text-primary"}`}
                  aria-hidden="true"
                />
                <span className="font-semibold text-sm">{link.label}</span>
                <span
                  className={`text-xs mt-0.5 ${link.accent ? "text-blue-200" : "text-neutral-400"}`}
                >
                  {link.description}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
