import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { SectionTitle } from "@/components/common/SectionTitle";

export function ContactSection() {
  return (
    <section className="section bg-neutral-50" aria-labelledby="contact-heading">
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <SectionTitle
              eyebrow="Contact"
              title="Get in Touch"
              subtitle="We are here to help. Reach out to us with any questions about admissions, academics, or general enquiries."
              id="contact-heading"
            />

            <div className="mt-7 space-y-5">
              {[
                {
                  icon: MapPin,
                  label: "Address",
                  content: "[Full Address]\n[City, State – PIN Code]",
                },
                {
                  icon: Phone,
                  label: "Telephone",
                  content: "[Phone Number]",
                  href: "tel:[Phone Number]",
                },
                {
                  icon: Mail,
                  label: "Email",
                  content: "[info@example.com]",
                  href: "mailto:[info@example.com]",
                },
                {
                  icon: Clock,
                  label: "Office Hours",
                  content: "Monday – Friday: 9:00 AM – 4:00 PM\nSaturday: 9:00 AM – 1:00 PM",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">
                        {item.label}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm text-primary hover:text-primary-700 font-medium transition-colors"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-sm text-neutral-700 whitespace-pre-line">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <Link href="/contact" className="btn-primary">
                Send Us a Message
              </Link>
            </div>
          </div>

          {/* Map — OpenStreetMap embed, no API key required */}
          <div className="rounded-card overflow-hidden border border-neutral-200 h-80 lg:h-auto">
            <iframe
              title="[Institution Name] location map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=0%2C0%2C0%2C0&layer=mapnik"
              className="w-full h-full border-0"
              loading="lazy"
              aria-label="Map showing institution location — update coordinates in the source before deployment"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
