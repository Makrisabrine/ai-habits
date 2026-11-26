"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { askAI } from "@/lib/ai";
import { computeCorrelations, predictTomorrowEnergy, summarize } from "@/lib/stats";
import { getEntries } from "@/actions/entries";
import { getProfile } from "@/actions/profile";
import type { Insight } from "@/lib/types";

/**
 * MODULE 3 (Azer) — Moteur d'analyse prédictive.
 * 1. corrélations calculées localement (déterministe, pas d'IA)
 * 2. l'IA ne sert qu'à transformer ces chiffres en conseils lisibles
 */
export async function generateInsights(range = 30): Promise<Insight> {
  const user = await requireUser();
  const entries = await getEntries(range);
  const profile = await getProfile();

  const correlations = computeCorrelations(entries);
  const prediction = predictTomorrowEnergy(entries);
  const stats = summarize(entries);

  const advice = await buildAdvice({ correlations, prediction, stats, profile, range });

  const insight: Insight = {
    userId: user.id,
    createdAt: new Date(),
    range,
    correlations,
    advice,
    prediction,
  };

  const db = await getDb();
  await db.collection("insights").insertOne({ ...insight });

  revalidatePath("/insights");
  revalidatePath("/report");
  revalidatePath("/coach");
  return insight;
}

/** Wrapper pour `<form action={...}>`. */
export async function generateInsightsAction(form: FormData) {
  const range = Number(form.get("range")) || 30;
  await generateInsights(range);
}

/** Dernière analyse en base, sans recalculer (utilisé par /report et le coach). */
export async function getLatestInsight(): Promise<Insight | null> {
  const user = await requireUser();
  const db = await getDb();
  const doc = await db
    .collection<Insight>("insights")
    .findOne({ userId: user.id }, { sort: { createdAt: -1 } });

  if (!doc) return null;
  const { _id, ...i } = doc;
  return i as Insight;
}

type AdviceInput = {
  correlations: ReturnType<typeof computeCorrelations>;
  prediction: ReturnType<typeof predictTomorrowEnergy>;
  stats: ReturnType<typeof summarize>;
  profile: Awaited<ReturnType<typeof getProfile>>;
  range: number;
};

async function buildAdvice({ correlations, prediction, stats, profile, range }: AdviceInput) {
  if (stats.days < 5) {
    return [
      "Pas encore assez de données pour une analyse fiable (minimum 5 jours de saisie).",
      "Continue à remplir ta saisie quotidienne, les corrélations apparaîtront automatiquement.",
    ];
  }

  const prompt = `Données d'un utilisateur sur ${range} jours (${stats.days} jours saisis).

Moyennes : énergie ${stats.energy}/10, sommeil ${stats.sleepHours}h (qualité ${stats.sleepQuality}/5), ${stats.caffeine} cafés/jour, stress ${stats.stress}/10, écran ${stats.screenTime} min/jour (réseaux ${stats.socialTime} min, vidéo ${stats.videoTime ?? "non renseigné"} min, jeux ${stats.gamingTime ?? "non renseigné"} min, travail ${stats.workTime ?? "non renseigné"} min), ${stats.steps} pas/jour.
Objectifs déclarés : ${profile.goals.sleepHours}h de sommeil, énergie cible ${profile.goals.energyTarget}/10, écran max ${profile.goals.screenTimeMax} min.
Symptômes les plus fréquents : ${stats.topSymptoms.map((s) => `${s.name} (${s.count}x)`).join(", ") || "aucun"}.

Corrélations mesurées (coefficient de Pearson, -1 à 1) :
${correlations.map((c) => `- ${c.label} : r = ${c.r} (${c.strength})`).join("\n") || "- aucune corrélation significative"}

Énergie prédite pour demain : ${prediction.tomorrowEnergy}/10 (risque de baisse : ${prediction.risk}).

Donne exactement 4 conseils personnalisés, concrets et actionnables, en français.
Appuie-toi sur les corrélations ci-dessus en citant les chiffres réels.
Une phrase par conseil, maximum 25 mots. Pas de numérotation, pas de markdown, un conseil par ligne.
Tu n'es pas médecin : ne pose aucun diagnostic.`;

  const text = await askAI(
    prompt,
    "Tu es un coach santé factuel et bienveillant. Tu t'appuies uniquement sur les données fournies."
  );

  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((l) => l.length > 15);

  return lines.length ? lines.slice(0, 4) : [text];
}
