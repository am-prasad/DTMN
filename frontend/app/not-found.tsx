import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="h-8 w-8 text-neutral-400" aria-hidden="true" />
        </div>

        <div className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          404 — Page Not Found
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-3">
          We couldn't find this page
        </h1>

        <p className="text-neutral-600 mb-8 text-sm leading-relaxed">
          The page you're looking for may have been moved, renamed, or is no 
          longer available. Please use the navigation below to find what you need.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Link href="/" className="btn-primary">Return Home</Link>
          <Link href="/contact" className="btn-secondary">Contact Us</Link>
        </div>

        <div className="text-sm text-neutral-500">
          <p className="font-medium text-neutral-600 mb-2">You might be looking for:</p>
          <div className="grid grid-cols-2 gap-2 text-left max-w-xs mx-auto">
            {[
              { href: "/admissions", label: "Admissions" },
              { href: "/events", label: "Events" },
              { href: "/circulars", label: "Circulars" },
              { href: "/faculty", label: "Faculty" },
              { href: "/gallery", label: "Gallery" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-primary hover:text-primary-700 hover:underline transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
