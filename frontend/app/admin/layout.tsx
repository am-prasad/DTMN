import type { Metadata } from "next";
import type { ReactNode } from "react";

import { api } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  let instName = "D T M N";
  try {
    const item = await api.content.get("institution_name");
    if (item?.value && !item.value.startsWith("[")) {
      instName = item.value;
    }
  } catch {}

  return {
    title: {
      default: `Admin — ${instName}`,
      template: `%s | Admin — ${instName}`,
    },
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  );
}
