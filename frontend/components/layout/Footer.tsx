import Link from "next/link";
import { GraduationCap, MapPin, Phone, Mail, Clock } from "lucide-react";

const QUICK_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/nursery", label: "Nursery" },
  { href: "/primary", label: "Primary School" },
  { href: "/high-school", label: "High School" },
  { href: "/college", label: "College" },
  { href: "/faculty", label: "Faculty" },
  { href: "/facilities", label: "Facilities" },
];

const USEFUL_LINKS = [
  { href: "/admissions", label: "Admissions" },
  { href: "/events", label: "Events" },
  { href: "/circulars", label: "Circulars & Notices" },
  { href: "/activities", label: "Activities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary-900 text-blue-100" aria-label="Site footer">
      {/* Main footer */}
      <div className="container-site py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Institution info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-accent rounded flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-white text-base leading-tight">D T M N</span>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed mb-4">
              [Inspiring Minds, Building Futures]
            </p>
            <div className="space-y-2.5 text-sm text-blue-200">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent-400" />
                <span>[Full Address]</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 flex-shrink-0 text-accent-400" />
                <a href="tel:[Phone Number]" className="hover:text-white transition-colors">
                  [Phone Number]
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 flex-shrink-0 text-accent-400" />
                <a href="mailto:[info@example.com]" className="hover:text-white transition-colors">
                  [info@example.com]
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent-400" />
                <span>Mon–Fri: 9 AM – 4 PM<br />Sat: 9 AM – 1 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Institution
            </h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Quick Access
            </h3>
            <ul className="space-y-2">
              {USEFUL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admissions CTA */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Admissions
            </h3>
            <p className="text-sm text-blue-200 mb-4 leading-relaxed">
              Admissions are open for the current academic session.
              Apply now or contact our admissions office for more information.
            </p>
            <Link href="/admissions" className="btn-accent btn-sm">
              Apply Now
            </Link>
            <div className="mt-4 text-sm text-blue-300">
              <div className="text-accent-400 font-medium text-xs uppercase tracking-wider mb-1">
                Admissions Office
              </div>
              <a href="mailto:[admissions@example.com]" className="hover:text-white transition-colors block">
                [admissions@example.com]
              </a>
              <a href="tel:[Admissions Phone]" className="hover:text-white transition-colors block">
                [Admissions Phone]
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-700">
        <div className="container-site py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-300">
          <p>
            &copy; {2026} D T M N. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="hover:text-white transition-colors">
              Staff Login
            </Link>
            <span>·</span>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
