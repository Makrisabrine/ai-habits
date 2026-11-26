import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/mongo";

/**
 * Cible de tous les retours d'auth :
 * - liens email (templates "Confirm signup" / "Reset Password") :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email|recovery
 * - retour OAuth Google : /auth/confirm?code=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Premier passage via Google : profil par défaut avec le prénom Google.
      const { id, email, user_metadata } = data.user;
      const db = await getDb();
      await db.collection("profiles").updateOne(
        { userId: id },
        {
          $setOnInsert: {
            userId: id,
            email,
            name: String(user_metadata.full_name ?? email?.split("@")[0] ?? "Utilisateur").split(" ")[0],
            goals: { sleepHours: 8, energyTarget: 7, screenTimeMax: 180 },
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      return NextResponse.redirect(new URL("/habits", request.url));
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const next = type === "recovery" ? "/reset-password" : "/habits";
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
