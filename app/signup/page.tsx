import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card } from "@/components/ui";
import { getUser } from "@/lib/auth";

export default async function SignupPage() {
  if (await getUser()) redirect("/habits");

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand-600">ATHAR HABITS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">Créer un compte</h1>
        <p className="mt-2 text-sm text-slate-500">Commence à suivre tes habitudes et ton équilibre numérique.</p>
      </div>
      <Card>
        <AuthForm mode="signup" />
      </Card>
    </div>
  );
}
