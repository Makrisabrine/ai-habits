import { getEntry } from "@/actions/entries";
import { EntryForm } from "@/components/entry-form";
import { Card, PageTitle } from "@/components/ui";
import { today } from "@/lib/types";

export default async function HabitsPage() {
  const date = today();
  const entry = await getEntry(date);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Suivi des habitudes"
        subtitle={`Tes habitudes du ${new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}.`}
      />
      <Card title="Saisie du jour" subtitle="Prends quelques instants pour noter comment tu te sens.">
        <EntryForm date={date} entry={entry} group="habit" />
      </Card>
    </div>
  );
}

