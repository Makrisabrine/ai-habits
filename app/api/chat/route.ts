import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/mongo";
import { askAI } from "@/lib/ai";
import { appendMessages, getConversation } from "@/lib/chat";
import { summarize } from "@/lib/stats";
import type { ChatMessage, Entry, Insight } from "@/lib/types";

/**
 * MODULE 4 (Maher) — Coach IA.
 * Seule route API du projet : le chat a besoin de POST + d'un état côté client.
 * Réponse non streamée volontairement : moins de code, suffisant pour la démo.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { messages?: ChatMessage[] };
  const last = Array.isArray(body.messages) ? body.messages.at(-1) : undefined;

  if (!last || last.role !== "user" || typeof last.content !== "string" || !last.content.trim())
    return NextResponse.json({ error: "message requis" }, { status: 400 });

  const content = last.content.trim().slice(0, 4000);

  const db = await getDb();
  const [entries, insight, stored] = await Promise.all([
    db
      .collection<Entry>("entries")
      .find({ userId: user.id })
      .sort({ date: -1 })
      .limit(7)
      .toArray(),
    db.collection<Insight>("insights").findOne({ userId: user.id }, { sort: { createdAt: -1 } }),
    getConversation(user.id),
  ]);

  // L'historique vient de MongoDB, pas du navigateur : on ne fait confiance
  // qu'au dernier message envoyé par le client.
  const history: ChatMessage[] = [...stored, { role: "user", content }];
  const reply = await askAI(history.slice(-10), buildSystem(entries, insight));

  await appendMessages(user.id, [
    { role: "user", content },
    { role: "assistant", content: reply },
  ]);

  return NextResponse.json({ reply });
}

function buildSystem(entries: Entry[], insight: Insight | null) {
  const stats = summarize(entries);

  const recent = entries
    .map(
      (e) =>
        `${e.date}: sommeil ${e.sleepHours}h (qualité ${e.sleepQuality}/5), ${e.caffeine} cafés (dernier à ${e.lastCaffeineHour}h), énergie ${e.energy}/10, stress ${e.stress}/10, écran ${e.screenTime}min, ${e.steps} pas${e.symptoms?.length ? `, symptômes: ${e.symptoms.join("/")}` : ""}`
    )
    .join("\n");

  return `Tu es le coach santé personnel de cet utilisateur dans l'application Athar Habits & Symptoms.

Ses 7 derniers jours :
${recent || "aucune donnée saisie"}

Moyennes : énergie ${stats.energy}/10, sommeil ${stats.sleepHours}h, ${stats.caffeine} cafés/jour, stress ${stats.stress}/10, écran ${stats.screenTime} min/jour.

${
  insight
    ? `Corrélations déjà détectées par le moteur d'analyse :
${insight.correlations.map((c) => `- ${c.label} (r = ${c.r})`).join("\n")}
Énergie prédite demain : ${insight.prediction.tomorrowEnergy}/10 (risque ${insight.prediction.risk}).
Conseils déjà donnés : ${insight.advice.join(" | ")}`
    : "Aucune analyse de corrélations n'a encore été lancée."
}

Règles :
- Réponds en français, de façon courte et concrète (3 phrases maximum sauf demande explicite).
- Appuie-toi toujours sur les chiffres ci-dessus et cite-les.
- Tu n'es pas médecin : aucun diagnostic, aucune prescription. En cas de symptôme inquiétant, recommande de consulter.
- Si la question sort du cadre santé/habitudes, ramène gentiment au sujet.`;
}
