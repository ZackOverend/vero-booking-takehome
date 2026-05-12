"use server";

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { revalidateTag, cacheTag, cacheLife } from "next/cache";
import { sql } from "drizzle-orm";

export async function getAiEnabled(): Promise<boolean> {
  "use cache";
  cacheTag("settings");
  cacheLife("max");
  const [row] = await db.select().from(settings).limit(1);
  if (row) return row.aiEnabled;
  // No row yet — fall back to env var without writing (no side effects in cache)
  return process.env.AI_ENABLED === "true";
}

export async function toggleAi() {
  const [updated] = await db
    .update(settings)
    .set({ aiEnabled: sql`NOT ${settings.aiEnabled}` })
    .returning({ aiEnabled: settings.aiEnabled });

  if (!updated) {
    const envDefault = process.env.AI_ENABLED === "true";
    await db.insert(settings).values({ aiEnabled: !envDefault });
  }

  revalidateTag("settings", "max");
}
