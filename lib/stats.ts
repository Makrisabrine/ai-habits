import type { Correlation, Entry } from "@/lib/types";

/** Corrélation de Pearson. Renvoie 0 si l'échantillon est trop petit ou constant. */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 4) return 0;

  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;

  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }

  if (!dx || !dy) return 0;
  return num / Math.sqrt(dx * dy);
}

export const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export const sd = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) ** 2)));
};

/**
 * Les paires qu'on teste. `lag: 1` = on regarde l'effet de X aujourd'hui
 * sur Y le lendemain (c'est le cas du café tardif -> énergie).
 */
const PAIRS: { x: keyof Entry; y: keyof Entry; lag: 0 | 1; label: string }[] = [
  { x: "lastCaffeineHour", y: "energy", lag: 1, label: "Café tardif → énergie plus basse le lendemain" },
  { x: "caffeine", y: "sleepQuality", lag: 0, label: "Nombre de cafés → qualité du sommeil" },
  { x: "sleepHours", y: "energy", lag: 0, label: "Heures de sommeil → énergie du jour" },
  { x: "sleepHours", y: "energy", lag: 1, label: "Heures de sommeil → énergie du lendemain" },
  { x: "screenTime", y: "sleepQuality", lag: 0, label: "Temps d'écran → qualité du sommeil" },
  { x: "socialTime", y: "stress", lag: 0, label: "Réseaux sociaux → niveau de stress" },
  { x: "steps", y: "energy", lag: 1, label: "Activité physique → énergie du lendemain" },
  { x: "stress", y: "sleepQuality", lag: 0, label: "Stress → qualité du sommeil" },
];

const strengthOf = (r: number): Correlation["strength"] => {
  const a = Math.abs(r);
  if (a >= 0.5) return "forte";
  if (a >= 0.3) return "moyenne";
  return "faible";
};

/** Aligne deux séries en respectant le décalage de jours (et les trous de saisie). */
function alignedSeries(entries: Entry[], x: keyof Entry, y: keyof Entry, lag: 0 | 1) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((e) => [e.date, e]));
  const xs: number[] = [];
  const ys: number[] = [];

  for (const e of sorted) {
    const target = lag === 0 ? e : byDate.get(addDays(e.date, 1));
    if (!target) continue; // pas de saisie le lendemain -> on saute

    const xv = e[x];
    const yv = target[y];
    if (typeof xv !== "number" || typeof yv !== "number") continue;

    xs.push(xv);
    ys.push(yv);
  }

  return { xs, ys };
}

/** Le coeur du module 3 : toutes les corrélations, triées par force. */
export function computeCorrelations(entries: Entry[]): Correlation[] {
  return PAIRS.map(({ x, y, lag, label }) => {
    const { xs, ys } = alignedSeries(entries, x, y, lag);
    const r = pearson(xs, ys);
    return { x: String(x), y: String(y), r: round(r, 2), label, strength: strengthOf(r) };
  })
    .filter((c) => Math.abs(c.r) >= 0.2)
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}

/**
 * Prédiction de l'énergie de demain.
 * Modèle volontairement simple et explicable : on part de la moyenne d'énergie
 * et on la corrige avec les écarts du jour sur les prédicteurs décalés (lag 1).
 */
export function predictTomorrowEnergy(entries: Entry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted.at(-1);
  const energies = sorted.map((e) => e.energy).filter((v) => typeof v === "number");

  const base = mean(energies);
  if (!last || energies.length < 5) {
    return { tomorrowEnergy: round(base || 5, 1), risk: "faible" as const };
  }

  const laggedPairs = PAIRS.filter((p) => p.lag === 1 && p.y === "energy");
  let shift = 0;
  let used = 0;

  for (const p of laggedPairs) {
    const { xs, ys } = alignedSeries(sorted, p.x, p.y, 1);
    const r = pearson(xs, ys);
    if (Math.abs(r) < 0.3) continue;

    const series = sorted.map((e) => e[p.x]).filter((v): v is number => typeof v === "number");
    const s = sd(series);
    if (!s) continue;

    const todayValue = last[p.x];
    if (typeof todayValue !== "number") continue;

    // écart du jour, en nombre d'écarts-types, pondéré par la force du lien
    shift += r * ((todayValue - mean(series)) / s);
    used++;
  }

  const predicted = used ? base + (shift / used) * sd(energies) : base;
  const tomorrowEnergy = round(clamp(predicted, 1, 10), 1);

  const risk = tomorrowEnergy < base - 1 ? "élevé" : tomorrowEnergy < base - 0.3 ? "modéré" : "faible";
  return { tomorrowEnergy, risk } as const;
}

/** Moyennes utilisées par le dashboard et le rapport. */
export function summarize(entries: Entry[]) {
  const num = (k: keyof Entry) =>
    entries.map((e) => e[k]).filter((v): v is number => typeof v === "number");
  const averageWhenRecorded = (key: keyof Entry) => {
    const values = num(key);
    return values.length ? Math.round(mean(values)) : null;
  };

  return {
    days: entries.length,
    energy: round(mean(num("energy")), 1),
    sleepHours: round(mean(num("sleepHours")), 1),
    sleepQuality: round(mean(num("sleepQuality")), 1),
    caffeine: round(mean(num("caffeine")), 1),
    stress: round(mean(num("stress")), 1),
    screenTime: Math.round(mean(num("screenTime"))),
    socialTime: Math.round(mean(num("socialTime"))),
    videoTime: averageWhenRecorded("videoTime"),
    gamingTime: averageWhenRecorded("gamingTime"),
    workTime: averageWhenRecorded("workTime"),
    steps: Math.round(mean(num("steps"))),
    topSymptoms: topSymptoms(entries),
  };
}

function topSymptoms(entries: Entry[]) {
  const counts = new Map<string, number>();
  for (const e of entries)
    for (const s of e.symptoms ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Arithmétique de dates en UTC pur.
 * Ne JAMAIS repasser par `new Date("...T00:00:00")` + `toISOString()` :
 * ça interprète la date en heure locale puis la reconvertit en UTC, ce qui
 * décale d'un jour pour tout fuseau à l'est de Greenwich (UTC+1 ici) et
 * annulait silencieusement le décalage des corrélations J+1.
 */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export const round = (n: number, p = 2) => Math.round(n * 10 ** p) / 10 ** p;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
