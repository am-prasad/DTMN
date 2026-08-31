"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarDays,
  Bell,
  Image,
  Users,
  BookOpen,
  Building2,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const NAV = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/events", icon: CalendarDays, label: "Events" },
  { href: "/admin/circulars", icon: Bell, label: "Circulars" },
  { href: "/admin/activities", icon: Activity, label: "Activities" },
  { href: "/admin/faculty", icon: Users, label: "Faculty" },
  { href: "/admin/gallery", icon: Image, label: "Gallery" },
  { href: "/admin/facilities", icon: Building2, label: "Facilities" },
  { href: "/admin/sections", icon: BookOpen, label: "Academic Sections" },
  { href: "/admin/admissions", icon: FileText, label: "Admissions" },
  { href: "/admin/content", icon: FileText, label: "Site Content" },
  { href: "/admin/users", icon: Shield, label: "Users" },
  { href: "/admin/audit", icon: FileText, label: "Audit Log" },
];

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminShell({ children, title }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.auth.logout();
    } catch {}
    router.replace("/admin/login");
  };

  const SidebarContent = () => (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-neutral-900 leading-tight truncate">
            [Institution Name]
          </div>
          <div className="text-[10px] text-neutral-400">Admin Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5" aria-label="Admin navigation">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(active ? "sidebar-link-active" : "sidebar-link")}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-neutral-200">
        <Link
          href="/"
          className="sidebar-link mb-1"
          aria-label="View public site"
          onClick={() => setSidebarOpen(false)}
        >
          <GraduationCap className="h-4 w-4 flex-shrink-0" />
          <span>View Public Site</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{loggingOut ? "Signing out…" : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-56 lg:flex-shrink-0 bg-white border-r border-neutral-200">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-neutral-200">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {title && (
              <h1 className="text-base font-semibold text-neutral-900 hidden sm:block">
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="hidden sm:inline">Admin Panel</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
