"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export async function getProfile(): Promise<Profile> {
  const user = await requireUser();
  const db = await getDb();
  const doc = await db.collection<Profile>("profiles").findOne({ userId: user.id });

  if (doc) {
    const { _id, ...profile } = doc;
    return {
      userId: profile.userId,
      email: profile.email,
      name: profile.name,
      goals: profile.goals,
      createdAt: profile.createdAt,
    };
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    name: user.email?.split("@")[0] ?? "Utilisateur",
    goals: { sleepHours: 8, energyTarget: 7, screenTimeMax: 180 },
  };
}

export async function saveProfile(form: FormData) {
  const user = await requireUser();

  const db = await getDb();
  await db.collection("profiles").updateOne(
    { userId: user.id },
    {
      $set: {
        name: String(form.get("name") ?? "").trim() || "Utilisateur",
        goals: {
          sleepHours: Number(form.get("sleepHours")) || 8,
          energyTarget: Number(form.get("energyTarget")) || 7,
          screenTimeMax: Number(form.get("screenTimeMax")) || 180,
        },
      },
      $setOnInsert: { userId: user.id, email: user.email, createdAt: new Date() },
    },
    { upsert: true }
  );

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/insights");
}
