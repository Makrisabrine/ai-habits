import { getEntry } from "@/actions/entries";
import { EntryForm } from "@/components/entry-form";
import { Card, PageTitle } from "@/components/ui";
import { today } from "@/lib/types";

export default async function DevicesPage() {
  const date = today();
  const entry = await getEntry(date);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Suivi des appareils"
        subtitle={`Tes usages du ${new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}.`}
      />
      <Card title="Saisie du jour" subtitle="Saisis ton temps d’écran, tes catégories et tes pas.">
        <EntryForm date={date} entry={entry} group="device" />
      </Card>
    </div>
  );
}
