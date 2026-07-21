"use server";

import { db } from "@/db";
import { dashboards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { emptyDashboardData, type DashboardData } from "@/lib/types";

export async function loadDashboardData(): Promise<DashboardData> {
  const rows = await db.select().from(dashboards).where(eq(dashboards.id, "main")).limit(1);

  if (rows.length === 0) {
    await db.insert(dashboards).values({ id: "main", data: emptyDashboardData });
    return emptyDashboardData;
  }

  // Merge with defaults so a freshly-added field (e.g. a new feature) never
  // shows up as `undefined` for an existing row created before that field existed.
  return { ...emptyDashboardData, ...(rows[0].data as Partial<DashboardData>) };
}

export async function saveDashboardData(data: DashboardData): Promise<{ ok: boolean }> {
  await db
    .insert(dashboards)
    .values({ id: "main", data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: dashboards.id,
      set: { data, updatedAt: new Date() },
    });

  return { ok: true };
}
