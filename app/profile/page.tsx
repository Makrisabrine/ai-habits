import { getProfile, saveProfile } from "@/actions/profile";
import { Card, PageTitle } from "@/components/ui";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle title="Mon profil" subtitle="Tes objectifs servent de référence à l'analyse IA." />

      <Card>
        <form action={saveProfile} className="space-y-4">
          <Field name="name" label="Prénom" defaultValue={profile.name} type="text" />

          <p className="text-sm text-slate-500">{profile.email}</p>

          <Field
            name="sleepHours"
            label="Objectif de sommeil (heures)"
            defaultValue={profile.goals.sleepHours}
            type="number"
            min={4}
            max={12}
            step={0.5}
          />
          <Field
            name="energyTarget"
            label="Énergie cible (/10)"
            defaultValue={profile.goals.energyTarget}
            type="number"
            min={1}
            max={10}
          />
          <Field
            name="screenTimeMax"
            label="Temps d'écran max (minutes/jour)"
            defaultValue={profile.goals.screenTimeMax}
            type="number"
            min={30}
            max={960}
            step={10}
          />

          <button className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/15 hover:-translate-y-0.5 hover:bg-brand-500">
            Enregistrer
          </button>
        </form>
      </Card>

    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type,
  min,
  max,
  step,
}: {
  name: string;
  label: string;
  defaultValue: string | number;
  type: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        className="mt-2 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10"
      />
    </label>
  );
}
