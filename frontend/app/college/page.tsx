import type { Metadata } from "next";
import { AcademicSectionPage } from "@/components/AcademicSectionPage";
export const metadata: Metadata = { title: "College", description: "College section at D T M N — Science, Commerce, and Arts programmes." };
export default function CollegePage() {
  return <AcademicSectionPage slug="college" label="College" breadcrumbLabel="College" />;
}
