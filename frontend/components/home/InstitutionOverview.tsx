import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/common/SectionTitle";

export function InstitutionOverview() {
  return (
    <section className="section bg-white" aria-labelledby="overview-heading">
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle
              eyebrow="About Us"
              title="A Legacy of Educational Excellence"
              id="overview-heading"
            />
            <div className="mt-5 space-y-4 text-neutral-600 leading-relaxed">
              <p>
                D T M N has been dedicated to quality education since [Year]. 
                What began as a small neighbourhood school has grown into a comprehensive 
                educational institution serving students from Nursery through College.
              </p>
              <p>
                Our approach to education is grounded in academic rigour, character 
                development, and the belief that every student possesses unique potential 
                that, with the right environment and guidance, can flourish.
              </p>
              <p>
                Across our four academic sections — Nursery, Primary School, High School, 
                and College — we maintain a consistent culture of respect, curiosity, and 
                responsibility.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-8 text-center">
              {[
                { label: "Academic Sections", value: "4" },
                { label: "Years of Service", value: "[N]+" },
                { label: "Departments", value: "[N]+" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-7">
              <Link href="/about" className="btn-secondary inline-flex items-center gap-2">
                Read More About Us
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="space-y-5">
            {[
              {
                label: "Our Vision",
                text: "To be a premier institution that nurtures curious, compassionate, and capable individuals prepared for an ever-changing world.",
                accent: true,
              },
              {
                label: "Our Mission",
                text: "To provide a supportive, stimulating, and inclusive learning environment that develops the intellectual, creative, social, and ethical potential of every student.",
              },
              {
                label: "Our Values",
                text: "Academic Excellence · Integrity · Inclusivity · Respect · Lifelong Learning",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`p-5 rounded-card border ${item.accent ? "bg-primary text-white border-primary" : "bg-neutral-50 border-neutral-200"}`}
              >
                <h3 className={`font-semibold text-sm uppercase tracking-wider mb-2 ${item.accent ? "text-accent-300" : "text-primary"}`}>
                  {item.label}
                </h3>
                <p className={`text-sm leading-relaxed ${item.accent ? "text-blue-100" : "text-neutral-600"}`}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
