"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Entry } from "@/lib/types";
import { pearson } from "@/lib/stats";

type Point = Entry & { label: string };

function toPoints(entries: Entry[]): Point[] {
  return entries.map((e) => ({
    ...e,
    label: new Date(`${e.date}T00:00:00`).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));
}

const AXIS = { stroke: "#8a88a5", fontSize: 12 };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "#171737",
  border: "1px solid #343253",
  borderRadius: 12,
  color: "#f7f6ff",
};
const TOOLTIP_LABEL_STYLE = { color: "#b9c3ff" };

function hasValues(entries: Entry[], keys: (keyof Entry)[]) {
  return entries.some((entry) =>
    keys.some((key) => typeof entry[key] === "number")
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center text-center text-sm text-slate-500">
      Aucune donnée {label} sur cette période. Ajoute-la dans la page de suivi correspondante.
    </div>
  );
}

/** Énergie vs stress — le graphique principal du dashboard. */
export function EnergyChart({ entries }: { entries: Entry[] }) {
  if (!hasValues(entries, ["energy", "stress"])) {
    return <EmptyChart label="d’énergie ou de stress" />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={toPoints(entries)}>
        <CartesianGrid stroke="#343253" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} minTickGap={24} />
        <YAxis domain={[0, 10]} tick={AXIS} width={28} />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Line type="monotone" dataKey="energy" name="Énergie" stroke="#7168f4" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="stress" name="Stress" stroke="#ff654f" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Sommeil : durée (ligne) — module 2b. */
export function SleepChart({ entries }: { entries: Entry[] }) {
  if (!hasValues(entries, ["sleepHours", "sleepQuality"])) {
    return <EmptyChart label="de sommeil" />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={toPoints(entries)}>
        <CartesianGrid stroke="#343253" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} minTickGap={24} />
        <YAxis domain={[0, 12]} tick={AXIS} width={28} />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Line type="monotone" dataKey="sleepHours" name="Heures de sommeil" stroke="#29c8c7" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="sleepQuality" name="Qualité (/5)" stroke="#7168f4" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Temps d'écran et réseaux sociaux — module 2a. */
export function ScreenChart({ entries }: { entries: Entry[] }) {
  if (!hasValues(entries, ["screenTime", "socialTime", "videoTime", "gamingTime", "workTime"])) {
    return <EmptyChart label="de temps d’écran" />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={toPoints(entries)}>
        <CartesianGrid stroke="#343253" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} minTickGap={24} />
        <YAxis tick={AXIS} width={36} />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Bar dataKey="screenTime" name="Écran (min)" fill="#b9c3ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="socialTime" name="Réseaux (min)" fill="#7168f4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const DEVICE_CATEGORIES = [
  { key: "socialTime", name: "Réseaux sociaux", color: "#7168f4" },
  { key: "videoTime", name: "Vidéo", color: "#29c8c7" },
  { key: "gamingTime", name: "Jeux vidéo", color: "#ff654f" },
  { key: "workTime", name: "Travail", color: "#b9c3ff" },
] as const;

export function DeviceCategoryDonutChart({
  entries,
  showSummary = true,
}: {
  entries: Entry[];
  showSummary?: boolean;
}) {
  const categories = DEVICE_CATEGORIES.map((category) => ({
    ...category,
    minutes: entries.reduce((total, entry) => {
      const value = entry[category.key];
      return total + (typeof value === "number" ? Math.max(value, 0) : 0);
    }, 0),
  }));
  const total = categories.reduce((sum, category) => sum + category.minutes, 0);

  if (total === 0) {
    return <EmptyChart label="classé par catégorie" />;
  }

  return (
    <div className="grid items-center gap-2 sm:grid-cols-2">
      <div className="relative h-56 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories.filter((category) => category.minutes > 0)}
              dataKey="minutes"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={3}
              stroke="#fff"
            >
              {categories
                .filter((category) => category.minutes > 0)
                .map((category) => (
                  <Cell key={category.key} fill={category.color} />
                ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(value) => `${Number(value).toLocaleString("fr-FR")} min`}
            />
          </PieChart>
        </ResponsiveContainer>
        {showSummary && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-brand-950">
              {total.toLocaleString("fr-FR")}
            </span>
            <span className="text-xs text-slate-500">min classées</span>
          </div>
        )}
      </div>
      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="truncate">{category.name}</span>
            </span>
            {showSummary && (
              <span className="shrink-0 font-medium text-brand-950">
                {category.minutes.toLocaleString("fr-FR")} min
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScreenSleepScatterChart({ entries }: { entries: Entry[] }) {
  const points = entries
    .filter(
      (entry): entry is Entry & { screenTime: number; sleepQuality: number } =>
        typeof entry.screenTime === "number" && typeof entry.sleepQuality === "number"
    )
    .map((entry) => ({
      screenTime: entry.screenTime,
      sleepQuality: entry.sleepQuality,
    }));

  if (points.length === 0) {
    return <EmptyChart label="associant temps d’écran et qualité du sommeil" />;
  }

  const correlation =
    points.length >= 4
      ? pearson(
          points.map((point) => point.screenTime),
          points.map((point) => point.sleepQuality)
        )
      : null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500" aria-live="polite">
        {correlation === null
          ? `${points.length} jour(s) avec les deux mesures · 4 minimum pour calculer la corrélation`
          : `Corrélation de Pearson : r = ${correlation.toFixed(2)} · ${points.length} jours`}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: -16 }}>
          <CartesianGrid stroke="#343253" />
          <XAxis
            type="number"
            dataKey="screenTime"
            name="Temps d’écran"
            unit=" min"
            tick={AXIS}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="sleepQuality"
            name="Qualité du sommeil"
            unit="/5"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={AXIS}
            width={32}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "#7168f4" }}
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
          />
          <Scatter name="Jours suivis" data={points} fill="#7168f4" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Pas quotidiens — données saisies dans le suivi des appareils. */
export function StepsChart({ entries }: { entries: Entry[] }) {
  if (!hasValues(entries, ["steps"])) {
    return <EmptyChart label="de pas" />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={toPoints(entries)}>
        <CartesianGrid stroke="#343253" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} minTickGap={24} />
        <YAxis tick={AXIS} width={48} />
        <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Line
          type="monotone"
          dataKey="steps"
          name="Pas"
          stroke="#29c8c7"
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
