import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card } from "@/components/ui";
import { getUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string; error?: string }>;
}) {
  if (await getUser()) redirect("/habits");
  const { check, error } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand-600">ATHAR HABITS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">Connexion</h1>
        <p className="mt-2 text-sm text-slate-500">Retrouve tes suivis et tes tendances personnelles.</p>
      </div>
      {check && (
        <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          Lien invalide ou expiré. Recommence l&apos;opération.
        </p>
      )}
      <Card>
        <AuthForm mode="login" />
      </Card>
    </div>
  );
}
