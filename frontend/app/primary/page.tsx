import type { Metadata } from "next";
import { AcademicSectionPage } from "@/components/AcademicSectionPage";
export const metadata: Metadata = { title: "Primary School", description: "Primary School at D T M N — foundational education for Classes I to V." };
export default function PrimaryPage() {
  return <AcademicSectionPage slug="primary" label="Primary School" breadcrumbLabel="Primary" />;
}
