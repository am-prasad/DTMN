import type { Metadata } from "next";
import { AcademicSectionPage } from "@/components/AcademicSectionPage";
export const metadata: Metadata = { title: "Nursery", description: "Early childhood education at [Institution Name]. Nurturing young learners through play-based, supportive programmes." };
export default function NurseryPage() {
  return <AcademicSectionPage slug="nursery" label="Nursery" breadcrumbLabel="Nursery" />;
}
