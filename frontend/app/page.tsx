import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { QuickAccess } from "@/components/home/QuickAccess";
import { InstitutionOverview } from "@/components/home/InstitutionOverview";
import { AcademicSections } from "@/components/home/AcademicSections";
import { EventsPreview } from "@/components/home/EventsPreview";
import { CircularsPreview } from "@/components/home/CircularsPreview";
import { ActivitiesPreview } from "@/components/home/ActivitiesPreview";
import { ContactSection } from "@/components/home/ContactSection";

export const metadata: Metadata = {
  title: "[Institution Name] — Official Website",
  description:
    "Welcome to [Institution Name]. We offer quality education from Nursery through College. Explore our academic sections, faculty, events, and admissions information.",
  openGraph: {
    title: "[Institution Name] — Official Website",
    description:
      "Quality education from Nursery through College in [City].",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickAccess />
      <InstitutionOverview />
      <AcademicSections />
      {/* @ts-expect-error — Server Component */}
      <EventsPreview />
      {/* @ts-expect-error — Server Component */}
      <CircularsPreview />
      {/* @ts-expect-error — Server Component */}
      <ActivitiesPreview />
      <ContactSection />
    </>
  );
}
