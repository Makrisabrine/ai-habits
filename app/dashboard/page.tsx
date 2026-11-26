import Link from "next/link";
import { getEntries } from "@/actions/entries";
import { getProfile } from "@/actions/profile";
import {
  DeviceCategoryDonutChart,
  EnergyChart,
  ScreenChart,
  ScreenSleepScatterChart,
  SleepChart,
  StepsChart,
} from "@/components/charts";
import { Card, Empty } from "@/components/ui";
import { addDays, summarize } from "@/lib/stats";
import { today, type Entry } from "@/lib/types";

const RANGES = [7, 30, 90];
type MetricKey =
  | "energy"
  | "sleepHours"
  | "sleepQuality"
  | "stress"
  | "screenTime"
  | "socialTime"
  | "steps";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: raw } = await searchParams;
  const range = RANGES.includes(Number(raw)) ? Number(raw) : 30;
  const currentDate = today();
  const cutoff = addDays(currentDate, 1 - range);
  const [history, profile] = await Promise.all([
    getEntries(Math.max(range * 2, 14)),
    getProfile(),
  ]);
  const entries = history.filter((entry) => entry.date >= cutoff);
  const stats = summarize(entries);
  const energyAverage = average(entries, "energy");
  const sleepAverage = average(entries, "sleepHours");
  const sleepQualityAverage = average(entries, "sleepQuality");
  const stressAverage = average(entries, "stress");
  const socialAverage = average(entries, "socialTime");
  const stepsAverage = average(entries, "steps");

  const weekdayOffset = (new Date(`${currentDate}T00:00:00`).getDay() + 6) % 7;
  const weekStart = addDays(currentDate, -weekdayOffset);
  const previousWeekStart = addDays(weekStart, -7);
  const previousWeekEnd = addDays(currentDate, -7);
  const thisWeekEntries = history.filter(
    (entry) => entry.date >= weekStart && entry.date <= currentDate
  );
  const previousWeekEntries = history.filter(
    (entry) => entry.date >= previousWeekStart && entry.date <= previousWeekEnd
  );

  const habitDays = new Set(entries.filter(hasHabitData).map((entry) => entry.date)).size;
  const deviceDays = new Set(entries.filter(hasDeviceData).map((entry) => entry.date)).size;
  const screenAverage = average(entries, "screenTime");
  const screenGoalProgress =
    screenAverage === null
      ? null
      : Math.round((screenAverage / profile.goals.screenTimeMax) * 100);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-6 text-white shadow-xl shadow-brand-950/15 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-brand-300">ESPACE PERSONNEL</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Bonjour {profile.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Un aperçu clair de tes habitudes, de ton sommeil et de ton équilibre numérique.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/habits"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-950 hover:-translate-y-0.5 hover:bg-brand-50"
            >
              Saisir mes habitudes
            </Link>
            <Link
              href="/devices"
              className="rounded-xl border border-white/25 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Suivi des appareils
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-brand-950">Vue d’ensemble</h2>
          <p className="text-sm text-slate-500">
            {stats.days} jour(s) de suivi · période de {range} jours
          </p>
        </div>
        <div className="surface flex w-fit rounded-xl border border-brand-100 bg-white/90 p-1 shadow-sm">
          {RANGES.map((days) => (
            <Link
              key={days}
              href={`/dashboard?range=${days}`}
              aria-current={days === range ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                days === range
                  ? "bg-brand-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-950"
              }`}
            >
              {days} j
            </Link>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <Empty>
          <p>Aucune donnée sur cette période : les indicateurs apparaîtront après tes premières saisies.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/habits"
              className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500"
            >
              Saisir mes habitudes
            </Link>
            <Link
              href="/devices"
              className="rounded-xl border border-brand-100 px-4 py-2 font-semibold text-brand-800 hover:bg-brand-50"
            >
              Saisir mes appareils
            </Link>
          </div>
        </Empty>
      )}

      <section id="dashboard-kpis" className="space-y-5">
        <SectionHeading
          eyebrow="INDICATEURS CLÉS"
          title="Tes résultats"
          description={`Moyennes et régularité sur la période sélectionnée (${range} jours).`}
        />
        <p className="text-xs text-slate-500">
          Les flèches comparent cette semaine aux mêmes jours de la semaine précédente.
        </p>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-brand-800">Habitudes et bien-être</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Énergie moyenne"
              value={formatAverage(energyAverage)}
              unit="/ 10"
              detail={energyAverage === null ? "Aucune mesure sur cette période" : "Niveau d’énergie déclaré"}
              comparison={weeklyComparison(thisWeekEntries, previousWeekEntries, "energy")}
            />
            <MetricCard
              label="Sommeil moyen"
              value={formatAverage(sleepAverage)}
              unit="h / nuit"
              detail={sleepAverage === null ? "Aucune mesure sur cette période" : `Objectif : ${profile.goals.sleepHours} h`}
              comparison={weeklyComparison(thisWeekEntries, previousWeekEntries, "sleepHours")}
            />
            <MetricCard
              label="Qualité du sommeil"
              value={formatAverage(sleepQualityAverage)}
              unit="/ 5"
              detail={sleepQualityAverage === null ? "Aucune mesure sur cette période" : "Qualité ressentie"}
              comparison={weeklyComparison(thisWeekEntries, previousWeekEntries, "sleepQuality")}
            />
            <MetricCard
              label="Stress moyen"
              value={formatAverage(stressAverage)}
              unit="/ 10"
              detail={stressAverage === null ? "Aucune mesure sur cette période" : "Niveau de stress déclaré"}
              comparison={weeklyComparison(thisWeekEntries, previousWeekEntries, "stress")}
            />
            <MetricCard
              label="Régularité"
              value={`${habitDays} / ${range}`}
              unit="jours"
              detail="Jours avec au moins une habitude saisie"
              progress={Math.round((habitDays / range) * 100)}
              progressTone="bg-brand-400"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-brand-800">Équilibre numérique</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Temps d’écran moyen"
              value={formatAverage(screenAverage)}
              unit="min / jour"
              detail={screenAverage === null ? "Aucune mesure sur cette période" : `Objectif : max. ${profile.goals.screenTimeMax} min / jour`}
              comparison={weeklyComparison(thisWeekEntries, previousWeekEntries, "screenTime")}
              progress={screenGoalProgress}
              progressTone={
                screenGoalProgress !== null && screenGoalProgress > 100
                  ? "bg-brand-coral"
                  : "bg-brand-600"
              }
            />
            <MetricCard
              label="Réseaux sociaux"
              value={formatAverage(socialAverage)}
              unit="min / jour"
              detail={socialAverage === null ? "Aucune mesure sur cette période" : "Moyenne quotidienne"}
              comparison={weeklyComparison(thisWeekEntries, previousWeekEntries, "socialTime")}
            />
            <MetricCard
              label="Pas quotidiens"
              value={formatAverage(stepsAverage)}
              unit="pas / jour"
              detail={stepsAverage === null ? "Aucune mesure sur cette période" : "Moyenne quotidienne"}
              comparison={weeklyComparison(thisWeekEntries, previousWeekEntries, "steps")}
            />
            <MetricCard
              label="Régularité appareil"
              value={`${deviceDays} / ${range}`}
              unit="jours"
              detail="Jours avec au moins une donnée appareil"
              progress={Math.round((deviceDays / range) * 100)}
              progressTone="bg-brand-400"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="GRAPHIQUES HABITUDES"
          title="Ton bien-être au quotidien"
          description="Évolution de tes habitudes et de ton sommeil."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Énergie et stress" subtitle="Échelles sur 10" className="h-full">
            <EnergyChart entries={entries} />
          </Card>
          <Card title="Sommeil" subtitle="Durée et qualité ressentie" className="h-full">
            <SleepChart entries={entries} />
          </Card>
          <Card
            title="Temps d’écran et qualité du sommeil"
            subtitle="Chaque point représente une journée avec les deux mesures."
            className="h-full"
          >
            <ScreenSleepScatterChart entries={entries} />
          </Card>
          {stats.topSymptoms.length > 0 && (
            <Card title="Symptômes les plus fréquents" className="h-full">
              <ul className="flex flex-wrap gap-2">
                {stats.topSymptoms.map((symptom) => (
                  <li
                    key={symptom.name}
                    className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800"
                  >
                    {symptom.name} · {symptom.count}x
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="ÉQUILIBRE NUMÉRIQUE"
          title="Tes appareils"
          description="Compare ton temps d’écran, tes activités et ton mouvement."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <Card
            title="Temps d’écran et réseaux sociaux"
            subtitle="Durée quotidienne en minutes"
            className="h-full"
          >
            <ScreenChart entries={entries} />
          </Card>
          <Card
            title="Répartition par catégorie"
            subtitle="Total des minutes classées sur la période sélectionnée"
            className="h-full"
          >
            <DeviceCategoryDonutChart entries={entries} />
          </Card>
          <Card title="Activité quotidienne" subtitle="Évolution du nombre de pas" className="h-full">
            <StepsChart entries={entries} />
          </Card>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.16em] text-brand-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-brand-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  comparison,
  progress,
  progressTone,
}: {
  label: string;
  value: string;
  unit: string;
  detail: string;
  comparison?: string;
  progress?: number | null;
  progressTone?: string;
}) {
  return (
    <article className="card rounded-2xl border border-brand-100 bg-white/90 p-4 backdrop-blur-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-brand-950">{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </p>
      <p className="mt-1 min-h-5 text-xs text-slate-500">{detail}</p>
      {progress !== undefined && progress !== null && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-50"
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.min(progress, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all ${progressTone ?? "bg-brand-600"}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {comparison && <p className="mt-2 text-xs font-medium text-brand-700">{comparison}</p>}
    </article>
  );
}

function average(entries: Entry[], key: MetricKey) {
  const values = entries
    .map((entry) => entry[key])
    .filter((value): value is number => typeof value === "number");

  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function formatAverage(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);
}

function weeklyComparison(current: Entry[], previous: Entry[], key: MetricKey) {
  const currentAverage = average(current, key);
  const previousAverage = average(previous, key);
  if (currentAverage === null || previousAverage === null) return undefined;
  if (previousAverage === 0) {
    return currentAverage === 0
      ? "→ 0 % vs semaine précédente"
      : "↑ Nouvelle mesure vs semaine précédente";
  }

  const change = ((currentAverage - previousAverage) / Math.abs(previousAverage)) * 100;
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(change);

  return `${arrow} ${formatted} % vs semaine précédente`;
}

function hasHabitData(entry: Entry) {
  return (
    typeof entry.sleepHours === "number" ||
    typeof entry.sleepQuality === "number" ||
    typeof entry.caffeine === "number" ||
    typeof entry.lastCaffeineHour === "number" ||
    typeof entry.meals === "number" ||
    typeof entry.energy === "number" ||
    typeof entry.stress === "number" ||
    Boolean(entry.symptoms?.length)
  );
}

function hasDeviceData(entry: Entry) {
  return (
    typeof entry.screenTime === "number" ||
    typeof entry.socialTime === "number" ||
    typeof entry.videoTime === "number" ||
    typeof entry.gamingTime === "number" ||
    typeof entry.workTime === "number" ||
    typeof entry.steps === "number"
  );
}
