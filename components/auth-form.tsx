"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, verifyLoginOtp, type FormState } from "@/actions/auth";

export function OtpForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(verifyLoginOtp, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <label className="block">
        <span className="text-sm font-medium text-brand-800">Code reçu par email</span>
        <input
          name="token"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6,10}"
          maxLength={10}
          placeholder="123456"
          autoFocus
          className="mt-2 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10"
        />
      </label>

      {state?.error && (
        <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/15 hover:-translate-y-0.5 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "..." : "Valider"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Pas reçu ?{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4">
          Recommencer
        </Link>
      </p>
    </form>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <Field name="name" label="Prénom" type="text" placeholder="Azer" />
      )}
      <Field name="email" label="Email" type="email" required placeholder="toi@exemple.com" />
      <Field name="password" label="Mot de passe" type="password" required placeholder="••••••" />

      {state?.error && (
        <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/15 hover:-translate-y-0.5 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            Pas de compte ?{" "}
            <Link href="/signup" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4">
              Inscription
            </Link>
          </>
        ) : (
          <>
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4">
              Connexion
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type,
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-brand-800">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10"
      />
    </label>
  );
}
