"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/mongo";

export type FormState = { error?: string } | undefined;

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();

  if (!email || password.length < 6)
    return { error: "Email requis et mot de passe de 6 caractères minimum." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Inscription impossible." };

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
  if (error) return { error: error.message };

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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
