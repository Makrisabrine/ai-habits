import Link from "next/link";
import { generateInsightsAction, getLatestInsight } from "@/actions/insights";
import { getEntries } from "@/actions/entries";
import { Card, Empty, PageTitle, Stat } from "@/components/ui";
import { aiProvider } from "@/lib/ai";
import type { Correlation } from "@/lib/types";

export default async function InsightsPage() {
  const [insight, entries] = await Promise.all([getLatestInsight(), getEntries(30)]);
  const provider = aiProvider();

  return (
    <>
      <PageTitle
        title="Insights IA"
        subtitle="Corrélations calculées sur tes données, conseils générés par l'IA."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form action={generateInsightsAction} className="flex items-center gap-2">
          <select
            name="range"
            defaultValue="30"
            className="rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10"
          >
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
          </select>
          <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500">
            Lancer l&apos;analyse
          </button>
        </form>

        {provider === "none" && (
          <span className="text-sm text-amber-300">
            Aucune clé IA configurée — les corrélations marchent, pas les conseils.
          </span>
        )}
      </div>

      {!insight ? (
        <Empty>
          {entries.length < 5 ? (
            <>
              Il faut au moins 5 jours de saisie. Lance{" "}
              <code className="font-mono">npm run seed</code> pour générer des données de démo.
            </>
          ) : (
            <>Clique sur « Lancer l&apos;analyse » pour calculer tes corrélations.</>
          )}
        </Empty>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Énergie prédite demain" value={insight.prediction.tomorrowEnergy} unit="/10" />
            <Stat label="Risque de baisse" value={insight.prediction.risk} />
            <Stat label="Fenêtre analysée" value={insight.range} unit="jours" />
          </div>

          <Card title="Conseils personnalisés" subtitle="Générés à partir des corrélations ci-dessous">
            <ul className="space-y-3">
              {insight.advice.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-medium text-white">
                    {i + 1}
                  </span>
                  <span className="text-slate-700">{a}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Corrélations détectées"
            subtitle="Coefficient de Pearson : proche de 1 ou -1 = lien fort"
          >
            {insight.correlations.length === 0 ? (
              <p className="text-slate-500">
                Aucune corrélation significative sur cette période. Continue la saisie.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {insight.correlations.map((c, i) => (
                  <CorrelationRow key={i} c={c} />
                ))}
              </ul>
            )}
          </Card>

          <p className="text-sm text-slate-500">
            Analyse du{" "}
            {new Date(insight.createdAt).toLocaleString("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
            })}{" "}
            ·{" "}
            <Link href="/report" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-4">
              Générer le rapport pour un professionnel de santé
            </Link>
          </p>
        </div>
      )}
    </>
  );
}

function CorrelationRow({ c }: { c: Correlation }) {
  const pct = Math.min(100, Math.abs(c.r) * 100);
  const negative = c.r < 0;

  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-slate-800">{c.label}</span>
        <span className="font-mono text-sm text-slate-500">r = {c.r}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${negative ? "bg-brand-coral" : "bg-brand-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-20 text-right text-xs uppercase tracking-wide text-slate-500">
          {c.strength}
        </span>
      </div>
    </li>
  );
}
