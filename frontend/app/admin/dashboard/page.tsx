"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  RefreshCw,
  Mail,
  AlertTriangle,
  Clock,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.admin.stats();
      setStats(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.detail || "Could not load statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refetch on window focus
    const handleFocus = () => fetchStats();
    window.addEventListener("focus", handleFocus);

    // Poll every 60 seconds
    const interval = setInterval(() => fetchStats(), 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchStats]);

  const STAT_CARDS = stats
    ? [
        {
          label: "Events",
          value: stats.events ? stats.events.total : stats.total_events,
          sub: stats.events
            ? `${stats.events.upcoming} upcoming · ${stats.events.drafts} drafts · ${stats.events.past} past`
            : `${stats.upcoming_events} upcoming`,
          icon: CalendarDays,
          href: "/admin/events",
          color: "text-blue-600 bg-blue-50",
        },
        {
          label: "Circulars",
          value: stats.circulars ? stats.circulars.published : stats.published_circulars,
          sub: stats.circulars
            ? `${stats.circulars.drafts} drafts · ${stats.circulars.expiring_7d} expiring in 7d`
            : "Published notices",
          icon: Bell,
          href: "/admin/circulars",
          color: "text-amber-600 bg-amber-50",
        },
        {
          label: "Faculty Members",
          value: stats.faculty ? stats.faculty.active : stats.total_faculty,
          sub: stats.faculty ? `${stats.faculty.inactive} inactive staff` : "Active staff",
          icon: Users,
          href: "/admin/faculty",
          color: "text-green-600 bg-green-50",
        },
        {
          label: "Gallery Albums",
          value: stats.gallery ? stats.gallery.published : stats.gallery_albums,
          sub: stats.gallery
            ? `${stats.gallery.empty_albums} empty albums`
            : "Published albums",
          icon: Image,
          href: "/admin/gallery",
          color: "text-purple-600 bg-purple-50",
        },
        {
          label: "Activities",
          value: stats.activities ? stats.activities.published : stats.total_activities,
          sub: stats.activities ? `${stats.activities.drafts} drafts` : "Published activities",
          icon: Activity,
          href: "/admin/activities",
          color: "text-rose-600 bg-rose-50",
        },
        {
          label: "Admission Enquiries",
          value: stats.enquiries ? stats.enquiries.new : stats.admission_enquiries,
          sub: stats.enquiries ? `${stats.enquiries.total} total enquiries` : "Prospective parents",
          icon: FileText,
          href: "/admin/admissions",
          color: "text-teal-600 bg-teal-50",
        },
        {
          label: "Contact Messages",
          value: stats.contact ? stats.contact.unread : 0,
          sub: "Unread messages",
          icon: Mail,
          href: "/admin/contact",
          color: "text-indigo-600 bg-indigo-50",
        },
      ]
    : [];

  const QUICK_ACTIONS = [
    { href: "/admin/events?action=new", label: "Add Event", icon: CalendarDays },
    { href: "/admin/circulars?action=new", label: "Add Circular", icon: Bell },
    { href: "/admin/activities?action=new", label: "Add Activity", icon: Activity },
    { href: "/admin/faculty?action=new", label: "Add Faculty", icon: Users },
    { href: "/admin/gallery?action=new", label: "Add Album", icon: Image },
    { href: "/admin/contact", label: "Contact Inbox", icon: Mail },
    { href: "/admin/content", label: "Edit Site Content", icon: FileText },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome & Refresh Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Dashboard</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Dynamic overview of your institution&apos;s website and activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-neutral-400">
                Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="btn-secondary btn-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
            <span className="text-sm font-medium">Loading statistics…</span>
          </div>
        )}

        {/* Needs Attention Panel */}
        {!loading && stats?.attention && stats.attention.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-900">Needs Attention</h3>
            </div>
            <div className="space-y-1.5">
              {stats.attention.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-amber-800">
                  <span>• {item.label}</span>
                  <Link
                    href={
                      item.resource === "admission"
                        ? "/admin/admissions"
                        : item.resource === "contact"
                        ? "/admin/contact"
                        : item.resource === "circular"
                        ? "/admin/circulars"
                        : "/admin/gallery"
                    }
                    className="font-medium underline hover:text-amber-950 ml-2"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {!loading && stats && (
          <section aria-labelledby="stats-heading">
            <h3 id="stats-heading" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Content & Activity Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STAT_CARDS.map((card) => {
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
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-bold text-neutral-900">{card.value}</div>
                      <div className="text-xs font-medium text-neutral-700 leading-tight">{card.label}</div>
                      {card.sub && (
                        <div className="text-[11px] text-neutral-400 mt-1 truncate">{card.sub}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {!loading && stats === null && (
          <div className="p-4 rounded-card bg-amber-50 border border-amber-200 text-sm text-amber-800">
            {error || "Could not load statistics. Please ensure you are logged in."}
          </div>
        )}

        {/* Quick Actions */}
        <section aria-labelledby="actions-heading">
          <h3 id="actions-heading" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="card p-4 flex items-center gap-3 text-sm font-medium text-neutral-700 hover:text-primary hover:shadow-card-hover transition-all group"
                >
                  <Icon className="h-4 w-4 text-neutral-400 group-hover:text-primary" aria-hidden="true" />
                  <span className="truncate">{action.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Activity Feed */}
        {!loading && stats?.recent && stats.recent.length > 0 && (
          <section aria-labelledby="activity-heading">
            <h3 id="activity-heading" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Recent Admin Activity
            </h3>
            <div className="card overflow-hidden divide-y divide-neutral-100">
              {stats.recent.map((rec, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-neutral-800">{rec.action.replace(/_/g, " ")}</span>
                      <span className="text-neutral-500"> by {rec.user}</span>
                      {rec.resource && <span className="text-neutral-400"> ({rec.resource})</span>}
                    </div>
                  </div>
                  {rec.at && (
                    <span className="text-neutral-400 whitespace-nowrap ml-4">
                      {new Date(rec.at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Links to Audit + Users */}
        <section aria-labelledby="admin-tools-heading">
          <h3 id="admin-tools-heading" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Administration Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/users" className="btn-secondary btn-sm">
              <Users className="h-4 w-4 mr-1.5" />
              Manage Users
            </Link>
            <Link href="/admin/audit" className="btn-secondary btn-sm">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Audit Log
            </Link>
            <Link href="/admin/settings" className="btn-secondary btn-sm">
              Security Settings
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
