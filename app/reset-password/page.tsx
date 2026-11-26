import { ResetPasswordForm } from "@/components/auth-form";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function ResetPasswordPage() {
  // Accessible uniquement via le lien email (qui ouvre la session de récupération).
  await requireUser();

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand-600">ATHAR HABITS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-slate-500">Choisis un mot de passe solide.</p>
      </div>
      <Card>
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
