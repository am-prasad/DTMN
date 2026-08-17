import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Bell,
  Users,
  Image,
  FileText,
  Activity,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

async function getStats(): Promise<AdminStats | null> {
  try {
    return await api.admin.stats();
  } catch {
    return null;
  }
}

const STAT_CARDS = (stats: AdminStats) => [
  {
    label: "Total Events",
    value: stats.total_events,
    sub: `${stats.upcoming_events} upcoming`,
    icon: CalendarDays,
    href: "/admin/events",
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Published Circulars",
    value: stats.published_circulars,
    icon: Bell,
    href: "/admin/circulars",
    color: "text-amber-600 bg-amber-50",
  },
  {
    label: "Faculty Members",
    value: stats.total_faculty,
    icon: Users,
    href: "/admin/faculty",
    color: "text-green-600 bg-green-50",
  },
  {
    label: "Gallery Albums",
    value: stats.gallery_albums,
    icon: Image,
    href: "/admin/gallery",
    color: "text-purple-600 bg-purple-50",
  },
  {
    label: "Activities",
    value: stats.total_activities,
    icon: Activity,
    href: "/admin/activities",
    color: "text-rose-600 bg-rose-50",
  },
  {
    label: "Admission Enquiries",
    value: stats.admission_enquiries,
    icon: FileText,
    href: "/admin/admissions",
    color: "text-teal-600 bg-teal-50",
  },
];

const QUICK_ACTIONS = [
  { href: "/admin/events?action=new", label: "Add Event", icon: CalendarDays },
  { href: "/admin/circulars?action=new", label: "Add Circular", icon: Bell },
  { href: "/admin/activities?action=new", label: "Add Activity", icon: Activity },
  { href: "/admin/faculty?action=new", label: "Add Faculty", icon: Users },
  { href: "/admin/gallery?action=new", label: "Add Album", icon: Image },
  { href: "/admin/content", label: "Edit Site Content", icon: FileText },
];

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <AdminShell title="Dashboard">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Welcome back</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Here's an overview of your institution's content.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <section aria-labelledby="stats-heading">
            <h3 id="stats-heading" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Content Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {STAT_CARDS(stats).map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.label}
                    href={card.href}
                    className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${card.color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-bold text-neutral-900">{card.value}</div>
                      <div className="text-xs text-neutral-500 leading-tight">{card.label}</div>
                      {card.sub && (
                        <div className="text-[11px] text-neutral-400 mt-0.5">{card.sub}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {stats === null && (
          <div className="p-4 rounded-card bg-amber-50 border border-amber-200 text-sm text-amber-800">
            Could not load statistics. The backend may be unavailable.
          </div>
        )}

        {/* Quick Actions */}
        <section aria-labelledby="actions-heading">
          <h3 id="actions-heading" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="card p-4 flex items-center gap-3 text-sm font-medium text-neutral-700 hover:text-primary hover:shadow-card-hover transition-all group"
                >
                  <Icon className="h-4 w-4 text-neutral-400 group-hover:text-primary" aria-hidden="true" />
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Links to Audit + Users */}
        <section aria-labelledby="admin-tools-heading">
          <h3 id="admin-tools-heading" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Administration
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/users" className="btn-secondary btn-sm">
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
            <Link href="/admin/audit" className="btn-secondary btn-sm">
              <TrendingUp className="h-4 w-4" />
              Audit Log
            </Link>
            <Link href="/admin/settings" className="btn-secondary btn-sm">
              Change Password
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
