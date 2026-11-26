"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveDeviceEntry, saveHabitEntry } from "@/actions/entries";
import { FIELDS, type Entry } from "@/lib/types";

const DEFAULTS: Record<string, number> = {
  sleepHours: 7,
  sleepQuality: 3,
  caffeine: 1,
  lastCaffeineHour: 10,
  meals: 3,
  energy: 6,
  stress: 4,
  screenTime: 180,
  socialTime: 60,
  videoTime: 0,
  gamingTime: 0,
  workTime: 0,
  steps: 5000,
};

export function EntryForm({
  date,
  entry,
  group,
}: {
  date: string;
  entry: Entry | null;
  group: "habit" | "device";
}) {
  const fields = FIELDS.filter((field) => field.group === group);
  const isHabit = group === "habit";

  return (
    <form action={isHabit ? saveHabitEntry : saveDeviceEntry} className="space-y-6">
      <input type="hidden" name="date" value={date} />

      <Group
        title={isHabit ? "Habitudes" : "Appareils"}
        hint={
          isHabit
            ? "Sommeil, nutrition, énergie, stress"
            : "Temps d’écran, catégories d’usage et pas — évite de compter deux fois la même durée."
        }
      >
        {fields.map((f) => (
          <Input key={f.key} field={f} value={value(entry, f.key)} />
        ))}
      </Group>

      {isHabit && (
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Symptômes</span>
          <input
            name="symptoms"
            defaultValue={(entry?.symptoms ?? []).join(", ")}
            placeholder="mal de tête, ballonnements, fatigue..."
            className="mt-2 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10"
          />
          <span className="mt-1 block text-xs text-slate-500">Séparés par des virgules</span>
        </label>
      )}

      <Submit existing={!!entry} group={group} />
    </form>
  );
}

function value(entry: Entry | null, key: string) {
  const v = entry?.[key as keyof Entry];
  return typeof v === "number" ? v : DEFAULTS[key] ?? 0;
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="font-semibold text-brand-950">{title}</legend>
      <p className="mb-3 text-sm text-slate-500">{hint}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Input({
  field,
  value: initial,
}: {
  field: (typeof FIELDS)[number];
  value: number;
}) {
  const [v, setV] = useState(initial);
  const isScale = field.max <= 10 && field.min >= 0 && field.step === 1;

  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-medium text-brand-800">
        {field.label}
        <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-brand-700">
          {v}
          {field.unit}
        </span>
      </span>

      <input
        name={field.key}
        type={isScale ? "range" : "number"}
        min={field.min}
        max={field.max}
        step={field.step}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className={
          isScale
            ? "mt-2 w-full accent-brand-600"
            : "mt-2 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10"
        }
      />
    </label>
  );
}

function Submit({ existing, group }: { existing: boolean; group: "habit" | "device" }) {
  const { pending } = useFormStatus();
  const subject = group === "habit" ? "mes habitudes" : "mes appareils";

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/15 hover:-translate-y-0.5 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending
        ? "Enregistrement..."
        : existing
          ? `Mettre à jour ${subject}`
          : `Enregistrer ${subject}`}
    </button>
  );
}
