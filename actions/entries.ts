"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { FIELDS, type Entry, today } from "@/lib/types";
import { addDays } from "@/lib/stats";

/**
 * Saisie du jour — fusionne les champs de Siwar (habits) et Sabrine (device)
 * dans un seul document par (userId, date). Upsert : re-soumettre met à jour.
 */
export async function saveHabitEntry(form: FormData) {
  await saveEntryGroup(form, "habit");
}

export async function saveDeviceEntry(form: FormData) {
  await saveEntryGroup(form, "device");
}

async function saveEntryGroup(form: FormData, group: "habit" | "device") {
  const user = await requireUser();
  const date = String(form.get("date") || today());

  const values: Record<string, number> = {};
  for (const f of FIELDS.filter((field) => field.group === group)) {
    const raw = form.get(f.key);
    if (raw === null || raw === "") continue;
    values[f.key] = Math.min(f.max, Math.max(f.min, Number(raw) || 0));
  }

  const setValues: Record<string, number | string[]> = { ...values };
  if (group === "habit") {
    setValues.symptoms = String(form.get("symptoms") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const db = await getDb();
  await db.collection("entries").updateOne(
    { userId: user.id, date },
    {
      $set: setValues,
      $setOnInsert: { userId: user.id, date, createdAt: new Date() },
    },
    { upsert: true }
  );

  revalidatePath("/habits");
  revalidatePath("/devices");
  revalidatePath("/dashboard");
  revalidatePath("/insights");
}

/** Les N derniers jours, triés du plus ancien au plus récent. */
export async function getEntries(range = 30): Promise<Entry[]> {
  const user = await requireUser();
  const from = addDays(today(), 1 - range);

  const db = await getDb();
  const docs = await db
    .collection<Entry>("entries")
    .find({ userId: user.id, date: { $gte: from } })
    .sort({ date: 1 })
    .toArray();

  return docs.map(({ _id, ...e }) => e as Entry);
}

export async function getEntry(date: string): Promise<Entry | null> {
  const user = await requireUser();
  const db = await getDb();
  const doc = await db.collection<Entry>("entries").findOne({ userId: user.id, date });
  if (!doc) return null;

  const { _id, ...e } = doc;
  return e as Entry;
}
