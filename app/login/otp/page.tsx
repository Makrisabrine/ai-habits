import { redirect } from "next/navigation";
import { OtpForm } from "@/components/auth-form";
import { Card } from "@/components/ui";
import { getUser } from "@/lib/auth";

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  if (await getUser()) redirect("/habits");
  const { email } = await searchParams;
  if (!email) redirect("/login");

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-brand-600">ATHAR HABITS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">Vérification</h1>
        <p className="mt-2 text-sm text-slate-500">
          Un code a été envoyé à <span className="font-medium text-brand-800">{email}</span>.
        </p>
      </div>
      <Card>
        <OtpForm email={email} />
      </Card>
    </div>
  );
}
