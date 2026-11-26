import Link from "next/link";
import { getEntries } from "@/actions/entries";
import { getLatestInsight } from "@/actions/insights";
import { getProfile } from "@/actions/profile";
import { Empty } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { summarize } from "@/lib/stats";

/**
 * MODULE 3 (Azer) — Rapport pour un professionnel de santé.
 * Anonymisé : aucun nom, aucun email. Seul un identifiant court dérivé du userId.
 * Le "PDF" = impression navigateur (Ctrl+P -> Enregistrer en PDF).
 */
export default async function ReportPage() {
  const [insight, entries, profile] = await Promise.all([
    getLatestInsight(),
    getEntries(90),
    getProfile(),
  ]);

  if (!insight) {
    return (
      <Empty>
        Aucune analyse disponible. Lance d&apos;abord{" "}
        <Link href="/insights" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-4">
          l&apos;analyse IA
        </Link>
        .
      </Empty>
    );
  }

  const stats = summarize(entries);
  const anonId = profile.userId.replace(/-/g, "").slice(0, 8).toUpperCase();

  return (
    <div className="print-page mx-auto max-w-3xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Document anonymisé — aucun nom ni email n&apos;y figure.
        </p>
        <PrintButton />
      </div>

      <header className="border-b border-slate-300 pb-4">
        <h1 className="text-xl font-semibold text-brand-950">
          Athar Habits — rapport de suivi des habitudes et symptômes
        </h1>
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-3">
          <Meta label="Identifiant patient" value={anonId} />
          <Meta label="Période" value={`${stats.days} jours de saisie`} />
          <Meta
            label="Édité le"
            value={new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}
          />
        </dl>
      </header>

      <Section title="1. Moyennes observées">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            <Row label="Durée de sommeil" value={`${stats.sleepHours} h / nuit`} target={`objectif ${profile.goals.sleepHours} h`} />
            <Row label="Qualité du sommeil" value={`${stats.sleepQuality} / 5`} />
            <Row label="Niveau d'énergie" value={`${stats.energy} / 10`} target={`cible ${profile.goals.energyTarget} / 10`} />
            <Row label="Niveau de stress" value={`${stats.stress} / 10`} />
            <Row label="Consommation de caféine" value={`${stats.caffeine} / jour`} />
            <Row label="Temps d'écran" value={`${stats.screenTime} min / jour`} target={`seuil ${profile.goals.screenTimeMax} min`} />
            <Row label="Réseaux sociaux" value={`${stats.socialTime} min / jour`} />
            <Row label="Vidéo" value={dailyMinutes(stats.videoTime)} />
            <Row label="Jeux vidéo" value={dailyMinutes(stats.gamingTime)} />
            <Row label="Travail sur écran" value={dailyMinutes(stats.workTime)} />
            <Row label="Activité physique" value={`${stats.steps} pas / jour`} />
          </tbody>
        </table>
      </Section>

      <Section title="2. Symptômes rapportés">
        {stats.topSymptoms.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun symptôme rapporté sur la période.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-700">
            {stats.topSymptoms.map((s) => (
              <li key={s.name}>
                {s.name} — {s.count} occurrence(s) sur {stats.days} jours
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="3. Corrélations statistiques">
        <p className="mb-3 text-sm text-slate-500">
          Coefficient de corrélation de Pearson calculé sur les {insight.range} derniers jours.
          Les paires marquées « lendemain » utilisent un décalage de 24 h.
        </p>
        {insight.correlations.length === 0 ? (
          <p className="text-sm text-slate-600">Aucune corrélation significative détectée.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-500">
                <th className="pb-2 font-medium">Relation</th>
                <th className="pb-2 font-medium">r</th>
                <th className="pb-2 font-medium">Intensité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insight.correlations.map((c, i) => (
                <tr key={i}>
                  <td className="py-2 text-slate-800">{c.label}</td>
                  <td className="py-2 font-mono">{c.r}</td>
                  <td className="py-2 text-slate-600">{c.strength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="4. Prédiction et recommandations">
        <p className="text-sm text-slate-700">
          Énergie prédite pour le jour suivant : <strong>{insight.prediction.tomorrowEnergy} / 10</strong>{" "}
          — risque de baisse <strong>{insight.prediction.risk}</strong>.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {insight.advice.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </Section>

      <footer className="mt-8 border-t border-slate-300 pt-4 text-xs text-slate-500">
        Document généré automatiquement par Athar Habits &amp; Symptoms à partir des déclarations de
        l&apos;utilisateur. Les corrélations sont statistiques et ne constituent pas un diagnostic
        médical.
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mt-6 rounded-2xl border border-brand-100 bg-white p-5">
      <h2 className="mb-3 font-semibold text-brand-950">{title}</h2>
      {children}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function Row({ label, value, target }: { label: string; value: string; target?: string }) {
  return (
    <tr>
      <td className="py-2 text-slate-600">{label}</td>
      <td className="py-2 text-right font-medium text-brand-950">{value}</td>
      <td className="py-2 pl-4 text-right text-xs text-slate-400">{target ?? ""}</td>
    </tr>
  );
}

function dailyMinutes(value: number | null) {
  return value === null ? "Non renseigné" : `${value} min / jour`;
}
