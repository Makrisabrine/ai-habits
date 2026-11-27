/**
 * CONTRAT PARTAGÉ — ne pas renommer ces champs sans prévenir l'équipe.
 * Tout le monde lit/écrit exactement ces clés dans la collection `entries`.
 */

export type Entry = {
  userId: string;
  date: string; // "YYYY-MM-DD"

  // volet Habit tracker (Siwar)
  sleepHours?: number; // heures
  sleepQuality?: number; // 1-5
  caffeine?: number; // nb de cafés
  lastCaffeineHour?: number; // 0-23
  meals?: number;
  energy?: number; // 1-10
  stress?: number; // 1-10
  symptoms?: string[];

  // volet Device (Sabrine)
  screenTime?: number; // minutes
  socialTime?: number; // minutes
  videoTime?: number; // minutes
  gamingTime?: number; // minutes
  workTime?: number; // minutes
  steps?: number;

  createdAt?: Date;
};

export type Profile = {
  userId: string;
  email: string;
  name: string;
  goals: {
    sleepHours: number;
    energyTarget: number;
    screenTimeMax: number;
  };
  createdAt?: Date;
};

export type Correlation = {
  x: string;
  y: string;
  r: number;
  label: string;
  strength: "forte" | "moyenne" | "faible";
};

export type Insight = {
  userId: string;
  createdAt: Date;
  range: number;
  correlations: Correlation[];
  advice: string[];
  prediction: { tomorrowEnergy: number; risk: "faible" | "modéré" | "élevé" };
};

/** Messages du coach IA, sauvegardés dans la collection `conversations`. */
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  userId: string;
  messages: ChatMessage[];
  updatedAt: Date;
};

/** Champs numériques saisissables, avec leurs bornes pour les formulaires. */
export const FIELDS = [
  { key: "sleepHours", label: "Heures de sommeil", min: 0, max: 14, step: 0.5, unit: "h", group: "habit" },
  { key: "sleepQuality", label: "Qualité du sommeil", min: 1, max: 5, step: 1, unit: "/5", group: "habit" },
  { key: "caffeine", label: "Cafés", min: 0, max: 10, step: 1, unit: "", group: "habit" },
  { key: "lastCaffeineHour", label: "Heure du dernier café", min: 0, max: 23, step: 1, unit: "h", group: "habit" },
  { key: "meals", label: "Repas", min: 0, max: 6, step: 1, unit: "", group: "habit" },
  { key: "energy", label: "Niveau d'énergie", min: 1, max: 10, step: 1, unit: "/10", group: "habit" },
  { key: "stress", label: "Niveau de stress", min: 1, max: 10, step: 1, unit: "/10", group: "habit" },
  { key: "screenTime", label: "Temps d'écran", min: 0, max: 960, step: 10, unit: "min", group: "device" },
  { key: "socialTime", label: "Réseaux sociaux", min: 0, max: 600, step: 10, unit: "min", group: "device" },
  { key: "videoTime", label: "Vidéo", min: 0, max: 960, step: 10, unit: "min", group: "device" },
  { key: "gamingTime", label: "Jeux vidéo", min: 0, max: 960, step: 10, unit: "min", group: "device" },
  { key: "workTime", label: "Travail sur écran", min: 0, max: 960, step: 10, unit: "min", group: "device" },
  { key: "steps", label: "Pas", min: 0, max: 30000, step: 500, unit: "", group: "device" },
] as const;

export type FieldKey = (typeof FIELDS)[number]["key"];

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f.label])
);

/** Date du jour au format "YYYY-MM-DD", en heure locale. */
export function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}
