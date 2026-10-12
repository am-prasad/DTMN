import { cache } from "react";
import { api } from "@/lib/api";

export const getSiteContent = cache(async (): Promise<Record<string, string>> => {
  try {
    const items = await api.content.list();
    return Object.fromEntries(items.map((i) => [i.key, i.value ?? ""]));
  } catch {
    return {};
  }
});
