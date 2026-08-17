import type { Metadata } from "next";
import { AcademicSectionPage } from "@/components/AcademicSectionPage";
export const metadata: Metadata = { title: "High School", description: "High School at [Institution Name] — secondary education for Classes VI to X." };
export default function HighSchoolPage() {
  return <AcademicSectionPage slug="high-school" label="High School" breadcrumbLabel="High School" />;
}
