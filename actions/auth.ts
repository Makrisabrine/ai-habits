"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { passwordError } from "@/lib/password";

export type FormState = { error?: string; message?: string } | undefined;

/** Contrôle de saisie commun inscription / reset. */
function checkNewPassword(form: FormData): string | null {
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("confirm") ?? ""))
    return "Les deux mots de passe ne correspondent pas.";
  return passwordError(password);
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email invalide." };
  const pwdError = checkNewPassword(form);
  if (pwdError) return { error: pwdError };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Inscription impossible." };
  // Email déjà inscrit : Supabase renvoie un faux user sans identité (anti-énumération).
  if (data.user.identities?.length === 0) redirect("/login?check=1");

  // Profil par défaut dans Mongo (module 1)
  const db = await getDb();
  await db.collection("profiles").updateOne(
    { userId: data.user.id },
    {
      $setOnInsert: {
        userId: data.user.id,
        email,
        name: name || email.split("@")[0],
        goals: { sleepHours: 8, energyTarget: 7, screenTimeMax: 180 },
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Si la confirmation par email est activée dans Supabase, pas de session ici.
  if (!data.session) redirect("/login?check=1");

  revalidatePath("/", "layout");
  redirect("/habits");
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.code === "email_not_confirmed")
    return { error: "Confirme d'abord ton email via le lien reçu à l'inscription." };
  if (error) return { error: "Email ou mot de passe incorrect." };

  // 2e facteur : on jette la session mot de passe, seule la session issue de l'OTP compte.
  await supabase.auth.signOut({ scope: "local" });
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpError) return { error: otpError.message };

  redirect(`/login/otp?email=${encodeURIComponent(email)}`);
}

export async function verifyLoginOtp(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const token = String(form.get("token") ?? "").trim();
  if (!email || !/^\d{6,10}$/.test(token)) return { error: "Code invalide." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: "Code invalide ou expiré." };

  revalidatePath("/", "layout");
  redirect("/habits");
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Email requis." };

  const supabase = await createClient();
  // Lien construit dans le template "Reset Password" (-> /auth/confirm?type=recovery).
  await supabase.auth.resetPasswordForEmail(email);
  // Même réponse que le compte existe ou non (anti-énumération).
  return { message: "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé." };
}

export async function updatePassword(_prev: FormState, form: FormData): Promise<FormState> {
  await requireUser(); // session ouverte par le lien de récupération
  const pwdError = checkNewPassword(form);
  if (pwdError) return { error: pwdError };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: String(form.get("password")) });
  if (error?.code === "same_password") return { error: "Choisis un mot de passe différent de l'ancien." };
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/habits");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
