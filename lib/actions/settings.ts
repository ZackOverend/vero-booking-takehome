"use server";

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { revalidatePath, revalidateTag, cacheTag, cacheLife } from "next/cache";

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
  const [row] = await db.select().from(settings).limit(1);

  if (row) {
    await db.update(settings).set({ aiEnabled: !row.aiEnabled });
  } else {
    // First toggle — create the row with the opposite of the env default
    const envDefault = process.env.AI_ENABLED === "true";
    await db.insert(settings).values({ aiEnabled: !envDefault });
  }

  revalidateTag("settings", "max");
  revalidatePath("/admin");
}
