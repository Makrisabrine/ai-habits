// Partagé client (checklist live) et serveur (validation réelle).
export const PASSWORD_RULES = [
  { label: "8 caractères minimum", test: (p: string) => p.length >= 8 },
  { label: "Une minuscule", test: (p: string) => /[a-z]/.test(p) },
  { label: "Une majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un chiffre", test: (p: string) => /\d/.test(p) },
  { label: "Un caractère spécial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

/** Message d'erreur si le mot de passe est faible, sinon null. */
export function passwordError(p: string): string | null {
  const missing = PASSWORD_RULES.filter((r) => !r.test(p)).map((r) => r.label.toLowerCase());
  return missing.length ? `Mot de passe trop faible : ${missing.join(", ")}.` : null;
}
