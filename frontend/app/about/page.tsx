import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about D T M N's history, vision, mission, values, and leadership. A legacy of educational excellence since 2001.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About D T M N"
        description="Our history, vision, and the values that guide everything we do."
        breadcrumbs={[{ label: "About" }]}
      />

      <div className="section bg-white">
        <div className="container-site max-w-4xl">
          {/* History */}
          <section className="mb-14" aria-labelledby="history-heading">
            <h2 id="history-heading" className="section-title">Our History</h2>
            <div className="mt-5 prose prose-neutral max-w-none text-neutral-600 leading-relaxed space-y-4">
              <p>
                D T M N was established in 2001 with a vision to provide quality 
                education to the community. What began as a small school with a handful of 
                students and dedicated teachers has grown, over the decades, into a comprehensive 
                educational institution covering Nursery through College.
              </p>
              <p>
                Throughout our history, we have remained committed to our founding principles: 
                that every student deserves a quality education, that teachers are the heart of 
                any great school, and that the relationship between school, family, and community 
                is essential to student success.
              </p>
              <p className="text-sm italic text-neutral-400">
                [This section should be updated with the institution&apos;s actual history.]
              </p>
            </div>
          </section>

          {/* Vision / Mission / Values */}
          <section className="mb-14" aria-labelledby="vmv-heading">
            <h2 id="vmv-heading" className="section-title">Vision, Mission & Values</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  title: "Vision",
                  content:
                    "To be a premier institution that nurtures curious, compassionate, and capable individuals prepared for an ever-changing world.",
                  bg: "bg-primary text-white",
                  label: "text-accent-300",
                },
                {
                  title: "Mission",
                  content:
                    "To provide a supportive, stimulating, and inclusive learning environment that develops the intellectual, creative, social, and ethical potential of every student.",
                  bg: "bg-neutral-50 border border-neutral-200",
                  label: "text-primary",
                },
                {
                  title: "Values",
                  content:
                    "Academic Excellence · Integrity · Inclusivity · Respect · Lifelong Learning",
                  bg: "bg-neutral-50 border border-neutral-200",
                  label: "text-primary",
                },
              ].map((item) => (
                <div key={item.title} className={`p-6 rounded-card ${item.bg}`}>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${item.label}`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${item.bg.includes("primary") ? "text-blue-100" : "text-neutral-600"}`}>
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Principal's Message */}
          <section className="mb-14" aria-labelledby="principal-heading">
            <h2 id="principal-heading" className="section-title">Principal&apos;s Message</h2>
            <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-card p-7">
              <blockquote className="text-neutral-700 leading-relaxed italic border-l-4 border-accent-400 pl-5">
                <p className="mb-4">
                  Dear Students, Parents, and Well-wishers,
                </p>
                <p className="mb-4">
                  Welcome to D T M N. It is my privilege to lead this institution, 
                  and I am deeply proud of our community&apos;s commitment to educational excellence 
                  and holistic development. We believe that every student possesses unique 
                  potential, and it is our responsibility to help each one discover and develop it.
                </p>
                <p className="mb-4">
                  Education at D T M N goes beyond textbooks and examinations. 
                  We strive to develop critical thinkers, responsible citizens, and confident 
                  individuals who are prepared for the challenges and opportunities that lie ahead.
                </p>
                <p>
                  I invite you to explore our institution and join our community of learners.
                </p>
              </blockquote>
              <footer className="mt-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-lg">
                  P
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">[Principal Name]</div>
                  <div className="text-sm text-neutral-500">Principal, D T M N</div>
                </div>
              </footer>
            </div>
          </section>

          {/* Milestones */}
          <section aria-labelledby="milestones-heading">
            <h2 id="milestones-heading" className="section-title">Key Milestones</h2>
            <p className="text-sm text-neutral-400 mt-2 italic">
              [Update this section with the institution&apos;s actual milestones and achievements.]
            </p>
            <div className="mt-6 space-y-4">
              {[
                { year: "2001", event: "Institution founded" },
                { year: "2006", event: "Primary School section established" },
                { year: "2001", event: "High School section added" },
                { year: "2018", event: "College section inaugurated" },
                
              ].map((m) => (
                <div key={m.year + m.event} className="flex gap-5 items-start">
                  <div className="w-16 text-sm font-bold text-primary flex-shrink-0 pt-0.5">
                    {m.year}
                  </div>
                  <div className="flex-1 text-sm text-neutral-700 border-l border-neutral-200 pl-5 pb-4">
                    {m.event}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
