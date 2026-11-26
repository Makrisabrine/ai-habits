/**
 * Génère 60 jours de données de démo AVEC des corrélations volontaires,
 * pour que /insights ait quelque chose de parlant à montrer.
 *
 *   npm run seed                 -> seed le premier profil trouvé
 *   npm run seed -- <userId>     -> seed un userId Supabase précis
 *
 * Corrélations injectées :
 *   café tardif        -> énergie basse le LENDEMAIN
 *   sommeil long       -> énergie haute
 *   temps d'écran haut -> qualité de sommeil basse
 *   réseaux sociaux    -> stress haut
 *   activité physique  -> énergie haute le lendemain
 */

import { config } from "dotenv";
import { MongoClient } from "mongodb";

config({ path: ".env.local" });

const DAYS = 60;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

function dateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI manquant dans .env.local");

  const client = await new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
  const db = client.db(process.env.MONGODB_DB || "habits");

  await db.collection("entries").createIndex({ userId: 1, date: 1 }, { unique: true });
  await db.collection("profiles").createIndex({ userId: 1 }, { unique: true });
  await db.collection("insights").createIndex({ userId: 1, createdAt: -1 });

  let userId = process.argv[2];
  if (!userId) {
    const profile = await db.collection("profiles").findOne({});
    if (!profile) {
      console.error(
        "Aucun profil en base. Crée un compte dans l'app, puis relance.\n" +
          "Ou passe un userId : npm run seed -- <uuid-supabase>"
      );
      process.exit(1);
    }
    userId = profile.userId as string;
    console.log(`Profil trouvé : ${profile.email ?? userId}`);
  }

  // On génère d'abord les causes, puis les effets (avec décalage d'un jour).
  const days = Array.from({ length: DAYS }, (_, i) => DAYS - 1 - i).map((daysAgo) => ({
    daysAgo,
    date: dateStr(daysAgo),
    sleepHours: round1(clamp(rnd(5, 9.5), 4, 11)),
    lastCaffeineHour: Math.round(rnd(8, 23)),
    caffeine: Math.round(rnd(0, 4)),
    meals: Math.round(rnd(2, 4)),
    screenTime: Math.round(rnd(90, 480) / 10) * 10,
    socialTime: 0,
    videoTime: 0,
    gamingTime: 0,
    workTime: 0,
    steps: Math.round(rnd(1500, 13000) / 100) * 100,
  }));

  for (const d of days) {
    d.socialTime = Math.round(d.screenTime * rnd(0.18, 0.28) / 10) * 10;
    d.videoTime = Math.round(d.screenTime * rnd(0.2, 0.32) / 10) * 10;
    d.gamingTime = Math.round(d.screenTime * rnd(0.05, 0.14) / 10) * 10;
    d.workTime = Math.max(0, d.screenTime - d.socialTime - d.videoTime - d.gamingTime);
  }

  const entries = days.map((d, i) => {
    const prev = days[i - 1];

    // qualité du sommeil : dégradée par l'écran
    const sleepQuality = Math.round(
      clamp(5 - (d.screenTime - 90) / 130 + rnd(-0.6, 0.6), 1, 5)
    );

    // stress : tiré par les réseaux sociaux
    const stress = Math.round(clamp(3 + (d.socialTime - 60) / 60 + rnd(-1.2, 1.2), 1, 10));

    // énergie : sommeil du jour + café tardif de la veille + activité de la veille
    const energy = Math.round(
      clamp(
        5.5 +
          (d.sleepHours - 7) * 1.1 +
          (prev ? -(prev.lastCaffeineHour - 15) * 0.28 : 0) +
          (prev ? (prev.steps - 7000) / 6000 : 0) -
          (stress - 4) * 0.25 +
          rnd(-0.9, 0.9),
        1,
        10
      )
    );

    const symptoms: string[] = [];
    if (energy <= 4) symptoms.push("fatigue");
    if (sleepQuality <= 2 && Math.random() < 0.6) symptoms.push("mal de tête");
    if (stress >= 7 && Math.random() < 0.5) symptoms.push("tension");
    if (d.caffeine >= 3 && Math.random() < 0.35) symptoms.push("ballonnements");

    return {
      userId,
      date: d.date,
      sleepHours: d.sleepHours,
      sleepQuality,
      caffeine: d.caffeine,
      lastCaffeineHour: d.lastCaffeineHour,
      meals: d.meals,
      energy,
      stress,
      symptoms,
      screenTime: d.screenTime,
      socialTime: d.socialTime,
      videoTime: d.videoTime,
      gamingTime: d.gamingTime,
      workTime: d.workTime,
      steps: d.steps,
      createdAt: new Date(),
    };
  });

  await db.collection("entries").deleteMany({ userId });
  await db.collection("entries").insertMany(entries);

  const avg = (k: "energy" | "sleepHours") =>
    round1(entries.reduce((s, e) => s + e[k], 0) / entries.length);

  console.log(`${entries.length} jours insérés pour ${userId}`);
  console.log(`énergie moyenne ${avg("energy")}/10 · sommeil moyen ${avg("sleepHours")}h`);
  console.log("Va sur /insights et lance l'analyse.");

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
