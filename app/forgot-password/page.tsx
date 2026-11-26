import { ForgotPasswordForm } from "@/components/auth-form";
import { Card } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand-600">ATHAR HABITS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-slate-500">Entre ton email, on t&apos;envoie un lien pour en choisir un nouveau.</p>
      </div>
      <Card>
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}
