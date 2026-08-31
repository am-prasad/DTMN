"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  {
    label: "About",
    items: [
      { href: "/about", label: "About Us" },
      { href: "/about#vision", label: "Vision & Mission" },
      { href: "/about#leadership", label: "Leadership" },
    ],
  },
  {
    label: "Academics",
    items: [
      { href: "/nursery", label: "Nursery" },
      { href: "/primary", label: "Primary School" },
      { href: "/high-school", label: "High School" },
      { href: "/college", label: "College" },
    ],
  },
  { href: "/faculty", label: "Faculty" },
  { href: "/facilities", label: "Facilities" },
  {
    label: "Student Life",
    items: [
      { href: "/activities", label: "Activities" },
      { href: "/gallery", label: "Gallery" },
    ],
  },
  { href: "/events", label: "Events" },
  { href: "/circulars", label: "Circulars" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

type NavItem =
  | { href: string; label: string; items?: undefined }
  | { label: string; href?: undefined; items: { href: string; label: string }[] };

// ---------------------------------------------------------------------------

function DropdownMenu({
  item,
  pathname,
}: {
  item: Extract<NavItem, { items: { href: string; label: string }[] }>;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const isActive = item.items.some((sub) => pathname.startsWith(sub.href) && sub.href !== "/");

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "nav-link flex items-center gap-1",
          isActive && "text-primary border-accent-500"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-48 bg-white rounded-card shadow-elevated border border-neutral-200 py-1 z-50"
          role="menu"
        >
          {item.items.map((sub) => (
            <Link
              key={sub.href}
              href={sub.href}
              role="menuitem"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  return (
    <>
      {/* Top info bar */}
      <div className="hidden lg:block bg-primary-900 text-blue-200 text-xs">
        <div className="container-site flex items-center justify-between py-1.5">
          <span className="font-medium text-white">[Institution Name]</span>
          <div className="flex items-center gap-6">
            <a href="tel:[Phone Number]" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="h-3 w-3" />
              [Phone Number]
            </a>
            <a href="mailto:[info@dtmn.com]" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="h-3 w-3" />
              [info@example.com]
            </a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header
        className={cn(
          "sticky top-0 z-40 bg-white transition-shadow duration-200",
          scrolled ? "shadow-card" : "border-b border-neutral-200"
        )}
      >
        <div className="container-site">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-9 h-9 bg-primary rounded flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-primary leading-tight">[Institution Name]</div>
                <div className="text-[10px] text-neutral-500 leading-tight tracking-wide">
                  Est. 2001
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {NAV_ITEMS.map((item) => {
                if ("items" in item && item.items) {
                  return (
                    <DropdownMenu
                      key={item.label}
                      item={item as Extract<NavItem, { items: { href: string; label: string }[] }>}
                      pathname={pathname}
                    />
                  );
                }
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href!);
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn("nav-link", isActive && "nav-link-active")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Admissions CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <Link href="/admissions" className="btn-primary btn-sm hidden sm:inline-flex">
                Admissions
              </Link>
              <button
                className="lg:hidden p-2 rounded text-neutral-600 hover:bg-neutral-100 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t border-neutral-200 bg-white overflow-y-auto max-h-[80vh]"
            aria-label="Mobile navigation"
          >
            <nav className="container-site py-3 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                if ("items" in item && item.items) {
                  const expanded = mobileExpanded === item.label;
                  return (
                    <div key={item.label}>
                      <button
                        className="flex items-center justify-between w-full px-3 py-2.5 rounded text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                        onClick={() => setMobileExpanded(expanded ? null : item.label)}
                        aria-expanded={expanded}
                      >
                        {item.label}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                      </button>
                      {expanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5 pb-1">
                          {item.items.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className="block px-3 py-2 rounded text-sm text-neutral-600 hover:bg-neutral-50 hover:text-primary transition-colors"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href!);
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      "block px-3 py-2.5 rounded text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary"
                        : "text-neutral-700 hover:bg-neutral-50 hover:text-primary"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-3 pb-2 border-t border-neutral-100 mt-2">
                <Link href="/admissions" className="btn-primary w-full justify-center">
                  Apply for Admission
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
