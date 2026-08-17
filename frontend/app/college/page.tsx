import type { Metadata } from "next";
import { AcademicSectionPage } from "@/components/AcademicSectionPage";
export const metadata: Metadata = { title: "College", description: "College section at [Institution Name] — Science, Commerce, and Arts programmes." };
export default function CollegePage() {
  return <AcademicSectionPage slug="college" label="College" breadcrumbLabel="College" />;
}
