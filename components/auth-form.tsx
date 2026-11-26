"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  verifyLoginOtp,
  type FormState,
} from "@/actions/auth";
import { PASSWORD_RULES } from "@/lib/password";

const linkClass = "font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4";

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

      <Feedback state={state} />
      <Submit pending={pending} label="Valider" />

      <p className="text-center text-sm text-slate-500">
        Pas reçu ?{" "}
        <Link href="/login" className={linkClass}>
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
    <>
    <form action={signInWithGoogle}>
      <GoogleButton />
    </form>
    <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
      <span className="h-px flex-1 bg-brand-100" />
      ou avec ton email
      <span className="h-px flex-1 bg-brand-100" />
    </div>
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <Field name="name" label="Prénom" type="text" placeholder="Azer" autoComplete="given-name" />
      )}
      <Field name="email" label="Email" type="email" required placeholder="toi@exemple.com" autoComplete="email" />
      {mode === "signup" ? (
        <NewPasswordFields />
      ) : (
        <>
          <Field
            name="password"
            label="Mot de passe"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <p className="-mt-2 text-right text-sm">
            <Link href="/forgot-password" className={linkClass}>
              Mot de passe oublié ?
            </Link>
          </p>
        </>
      )}

      <Feedback state={state} />
      <Submit pending={pending} label={mode === "login" ? "Se connecter" : "Créer mon compte"} />

      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            Pas de compte ?{" "}
            <Link href="/signup" className={linkClass}>
              Inscription
            </Link>
          </>
        ) : (
          <>
            Déjà inscrit ?{" "}
            <Link href="/login" className={linkClass}>
              Connexion
            </Link>
          </>
        )}
      </p>
    </form>
    </>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-brand-100 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6C44.1 38 46.5 31.8 46.5 24.5z" />
        <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.8l7.9-6.2z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
      </svg>
      {pending ? "..." : "Continuer avec Google"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(requestPasswordReset, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field name="email" label="Email" type="email" required placeholder="toi@exemple.com" autoComplete="email" />
      <Feedback state={state} />
      <Submit pending={pending} label="Envoyer le lien" />
      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className={linkClass}>
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updatePassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <NewPasswordFields />
      <Feedback state={state} />
      <Submit pending={pending} label="Enregistrer" />
    </form>
  );
}

/** Mot de passe + confirmation, avec checklist live des règles (revalidées côté serveur). */
function NewPasswordFields() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <>
      <label className="block">
        <span className="text-sm font-medium text-brand-800">Mot de passe</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="password-rules"
          className={inputClass}
        />
      </label>
      <ul id="password-rules" className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.label} className={ok ? "text-emerald-600" : "text-slate-400"}>
              {ok ? "✓" : "○"} {r.label}
            </li>
          );
        })}
      </ul>
      <label className="block">
        <span className="text-sm font-medium text-brand-800">Confirmer le mot de passe</span>
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
        {confirm && confirm !== password && (
          <span className="mt-1 block text-xs text-red-500">Les mots de passe ne correspondent pas.</span>
        )}
      </label>
    </>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
        {state.error}
      </p>
    );
  if (state?.message)
    return (
      <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
        {state.message}
      </p>
    );
  return null;
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/15 hover:-translate-y-0.5 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "..." : label}
    </button>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10";

function Field({
  name,
  label,
  type,
  required,
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-brand-800">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClass}
      />
    </label>
  );
}
