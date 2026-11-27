# Athar Habits & Symptoms

Appli web Next.js (PWA) : l'utilisateur consigne ses habitudes quotidiennes (sommeil, nutrition, activité, écran), l'IA croise les données pour détecter des tendances et prédire les baisses d'énergie.

**Règle du projet : simplicité. Pas de microservices, pas de queue, pas de cache, pas de tests E2E. On livre un flux qui marche de bout en bout.**

---

## 1. Stack

| Couche | Choix |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Données | MongoDB 8.0.38 sur WSL Ubuntu (`mongodb://127.0.0.1:27017`), driver officiel `mongodb` v7 |
| Auth | **Supabase Auth** (email/password) — *remplace Firebase du cahier des charges* |
| Mutations | **Server Actions** uniquement (pas de REST sauf 1 route pour le PDF si besoin) |
| IA | OpenRouter → `nvidia/nemotron-3.5-super-vl:free` (gratuit). Fallbacks Groq / Gemini intégrés, un seul `askAI()` |
| UI | Tailwind CSS + shadcn/ui |
| Graphiques | Recharts |
| PDF | page `/report` + `window.print()` (CSS `@media print`) |

> PDF : on n'installe pas de lib PDF. Une page imprimable = PDF en 1 clic, zéro dépendance.

---

## 2. Variables d'environnement (`.env.local`)

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=habits

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx

# IA : une seule clé suffit, priorité OpenRouter > Groq > Gemini
OPENROUTER_API_KEY=sk-or-v1-xxxx
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
# GROQ_API_KEY=gsk_xxxx
# GEMINI_API_KEY=xxxx
```

`lib/ai.ts` détecte seule la clé présente. Si aucune n'est configurée, `askAI()` renvoie un message d'indisponibilité au lieu de lever une exception : les corrélations et la prédiction, calculées localement, restent affichées.

---

## 3. Modèle de données — 4 collections, c'est tout

MongoDB est sans schéma : on reste large et plat. `userId` = l'UUID Supabase (`user.id`).

### `profiles`
```js
{
  userId: "uuid-supabase",      // unique
  email: "a@b.com",
  name: "Aziz",
  goals: { sleepHours: 8, energyTarget: 7, screenTimeMax: 180 },
  createdAt: Date
}
```

### `entries` — une saisie par utilisateur par jour (habits + device fusionnés)
```js
{
  userId: "uuid-supabase",
  date: "2026-11-13",           // string YYYY-MM-DD (simple à trier/filtrer)

  // volet Habit tracker (Siwar)
  sleepHours: 7.5,
  sleepQuality: 4,              // 1-5
  caffeine: 2,                  // nb de cafés
  lastCaffeineHour: 21,         // 0-23
  meals: 3,
  energy: 6,                    // 1-10
  stress: 4,                    // 1-10
  symptoms: ["mal de tête"],    // tableau de strings

  // volet Device (Sabrine)
  screenTime: 240,              // minutes
  socialTime: 90,               // minutes
  videoTime: 60,                // minutes
  gamingTime: 30,               // minutes
  workTime: 45,                 // minutes
  steps: 6000,

  createdAt: Date
}
```
Index unique : `{ userId: 1, date: 1 }` → un seul doc par jour, on fait un `upsert`.

### `insights` — sorties du moteur d'analyse (Azer) et du coach (Maher)
```js
{
  userId: "uuid-supabase",
  createdAt: Date,
  range: 30,                          // fenêtre analysée en jours
  correlations: [
    { x: "lastCaffeineHour", y: "energy", r: -0.62, label: "Café tardif → énergie basse le lendemain" }
  ],
  advice: ["Évite le café après 17h...", "..."],   // texte généré par l'IA
  prediction: { tomorrowEnergy: 4, risk: "élevé" }
}
```

### `conversations` — historique du coach (Maher)

```js
{
  userId: "uuid-supabase",            // unique, une seule conversation par utilisateur
  messages: [
    { role: "user", content: "..." },
    { role: "assistant", content: "..." }
  ],                                  // 60 messages max (les plus anciens sont supprimés)
  updatedAt: Date
}
```

La page `/coach` lit cette collection au rendu : la conversation survit à la navigation, au rechargement et à une déconnexion/reconnexion. La route `/api/chat` n'ajoute que le dernier message du navigateur à l'historique serveur, puis sauvegarde la réponse.

---

## 4. Arborescence

```
app/
  layout.tsx                # nav + conteneur
  page.tsx                  # landing (redirige vers /today si connecté)
  login/page.tsx            # Aziz
  signup/page.tsx           # Aziz
  profile/page.tsx          # Aziz — objectifs santé
  today/page.tsx            # Siwar + Sabrine — saisie du jour
  dashboard/page.tsx        # Siwar + Sabrine — graphiques, tendances hebdo et catégories
  insights/page.tsx         # Azer — corrélations + conseils IA
  report/page.tsx           # Azer — page imprimable (PDF)
  coach/page.tsx            # Maher — chat
  api/chat/route.ts         # Maher — seule route API du projet
lib/
  types.ts                  # LE CONTRAT : type Entry, FIELDS, Profile, Insight
  mongo.ts                  # connexion unique réutilisée (cache global en dev)
  auth.ts                   # requireUser() / getUser()
  supabase/client.ts        # client navigateur
  supabase/server.ts        # client serveur (cookies)
  chat.ts                   # historique du coach dans MongoDB (1 conversation/userId)
  ai.ts                     # askAI() — bascule OpenRouter/Groq/Gemini automatique
  stats.ts                  # pearson(), corrélations décalées, prédiction, moyennes
actions/
  auth.ts                   # Aziz — signUp / signIn / signOut
  profile.ts                # Aziz
  entries.ts                # Siwar + Sabrine — saveEntry / getEntries / getEntry
  insights.ts               # Azer — generateInsights / getLatestInsight
components/
  nav.tsx  ui.tsx  auth-form.tsx  entry-form.tsx  charts.tsx  chat.tsx  print-button.tsx
scripts/
  seed.ts                   # 60 jours de données corrélées -> npm run seed
```

**Pas de `middleware.ts`.** Next 16 l'a renommé `proxy.ts` et l'API bouge encore : chaque page protégée commence par `await requireUser()` (`lib/auth.ts`). Plus explicite, zéro risque de casse à la mise à jour.

---

## 5. Le pattern à copier partout

Tout est déjà écrit. Pour ajouter une fonctionnalité, copie ce squelette de Server Action (`actions/entries.ts` en est l'exemple complet) :

```ts
"use server";
import { getDb } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function maFonction(form: FormData) {
  const user = await requireUser();          // 1. auth, toujours en premier
  const db = await getDb();                  // 2. connexion mutualisée
  await db.collection("entries").updateOne(  // 3. upsert sur (userId, date)
    { userId: user.id, date: String(form.get("date")) },
    { $set: { /* ... */ } },
    { upsert: true }
  );
  revalidatePath("/dashboard");              // 4. rafraîchir les pages touchées
}
```

Les briques déjà disponibles :

| Fonction | Fichier | À quoi ça sert |
|---|---|---|
| `getDb()` | `lib/mongo.ts` | connexion Mongo mutualisée (ne pas en créer d'autre) |
| `requireUser()` | `lib/auth.ts` | protège une page/action, redirige vers `/login` |
| `askAI(prompt, system)` | `lib/ai.ts` | Groq ou Gemini selon la clé présente, ne throw jamais |
| `pearson(xs, ys)` | `lib/stats.ts` | coefficient de corrélation |
| `computeCorrelations(entries)` | `lib/stats.ts` | les 8 paires testées, dont 4 à décalage d'un jour |
| `predictTomorrowEnergy(entries)` | `lib/stats.ts` | prédiction + niveau de risque |
| `summarize(entries)` | `lib/stats.ts` | moyennes + top symptômes |
| `getEntries(range)` | `actions/entries.ts` | les N derniers jours de l'utilisateur courant |
| `getConversation(userId)` / `appendMessages()` | `lib/chat.ts` | conversation du coach persistée dans `conversations` (60 messages max, retrouvée après déconnexion) |

---

## 6. Répartition des modules

| # | Module | Responsable | Livrable concret |
|---|---|---|---|
| 1 | Auth & profils | **Aziz** | `/login`, `/signup`, `/profile`, `lib/auth.ts`, collection `profiles` |
| 2a | Saisie Device | **Sabrine** | champs écran/social/pas dans `/today` + leurs graphiques sur `/dashboard` |
| 2b | Saisie Habit tracker | **Siwar** | formulaire `/today`, graphiques 7/30/90j et suivi hebdomadaire |
| 3 | Analyse prédictive & rapport | **Azer** | `lib/stats.ts`, `actions/insights.ts`, `/insights`, `/report` imprimable |
| 4 | Coach IA | **Maher** | `/coach` + `api/chat` : lit `entries` + dernier `insights` comme contexte |

**Flux :** Aziz fournit l'identité → Sabrine & Siwar remplissent `entries` → Azer calcule `insights` → Maher s'appuie sur `insights` pour conseiller.

**Contrat entre nous (à ne pas casser) :** le type `Entry` et la constante `FIELDS` dans `lib/types.ts`. Ajouter un champ = l'ajouter dans `FIELDS`, il apparaît automatiquement dans le formulaire `/today` et dans la validation de `saveEntry`.

---

## 7. Mise en route

Le projet est déjà scaffoldé et les dépendances installées. Il reste 3 choses :

**1. Mongo — fait.** MongoDB 8.0.38 est installé et actif dans WSL (`sudo systemctl status mongod`), joignable depuis Windows sur `127.0.0.1:27017` grâce au localhost forwarding de WSL. Rien à faire au redémarrage : le service est `enabled`.

> Piège de l'install : la distro WSL par défaut est Ubuntu **26.04 (`resolute`)**, pour laquelle MongoDB ne publie **pas** le serveur (seulement l'Atlas CLI et les database tools). On pointe donc le dépôt sur **`noble` (24.04)** — les dépendances se résolvent proprement sur 26.04 et le serveur tourne. Fichier : `/etc/apt/sources.list.d/mongodb-noble.list`.
>
> Pour travailler à cinq sur la **même** base (sinon chacun a sa base vide et le flux complet n'est pas testable à plusieurs), un cluster gratuit Atlas M0 reste la meilleure option : seule `MONGODB_URI` change.

**2. Supabase.** Créer le projet, copier l'URL et la clé publishable depuis *Settings → API Keys*. **Pour la démo : désactiver la confirmation par email** (*Authentication → Sign In / Providers → Email → décocher « Confirm email »*), sinon chaque inscription attend un clic dans la boîte mail.

Si la confirmation par email reste activée :
- *Authentication → URL Configuration* : **Site URL** = `http://localhost:3100`, **Redirect URLs** = `http://localhost:3100/**` (le port 3000 est réservé par Hyper-V, voir §9).
- *Authentication → Email Templates → Confirm signup* : le lien doit être `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (et `type=recovery` pour *Reset Password*). Ne pas utiliser `{{ .ConfirmationURL }}` : il envoie le `?code=` sur `/`, qui ne sait pas ouvrir de session. La route `app/auth/confirm/route.ts` échange le `code`/`token_hash` et redirige vers `/habits`.

**3. Clé IA — fait.** OpenRouter avec `nvidia/nemotron-3.5-super-vl:free`. Vérifié de bout en bout via `npm run check` : 4 conseils en français, chacun adossé à une corrélation mesurée. Groq et Gemini restent branchables sans changer une ligne de code applicatif.

```bash
cp .env.local.example .env.local   # puis remplir les 4 valeurs
npm run dev                        # http://localhost:3100

# créer un compte dans l'app, puis :
npm run seed                       # 60 jours de données corrélées
# ou pour un userId précis : npm run seed -- <uuid-supabase>
```

Le seed est **indispensable à la démo** : il injecte volontairement les corrélations (café tardif → énergie basse le lendemain, écran → qualité de sommeil, réseaux sociaux → stress) pour que `/insights` affiche des résultats parlants au lieu de bruit aléatoire.

Vérifications disponibles :

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm run build
npm run check       # fait tourner le moteur d'analyse hors UI sur les données en base
                    # npm run check -- <userId> pour cibler un utilisateur
```

`npm run check` est l'outil de debug du module 3 : il affiche les moyennes, les corrélations avec leur r et la prédiction, sans passer par le navigateur ni par l'IA.

---

## 8. État d'avancement

Squelette complet livré, les 5 modules ont une version qui tourne de bout en bout :

- [x] Scaffold Next 16 + Tailwind 4, `lib/mongo.ts`, `lib/supabase/*`, `lib/types.ts`
- [x] Auth Supabase : `/signup`, `/login`, déconnexion, `requireUser()`, profil auto-créé
- [x] `/profile` : objectifs santé (sommeil, énergie cible, seuil écran)
- [x] `/today` : formulaire unique habits + device, upsert par jour, pré-rempli si déjà saisi
- [x] `/dashboard` : 3 graphiques Recharts + 4 indicateurs + top symptômes, bascule 7/30/90j
- [x] `/insights` : 8 corrélations dont 4 décalées d'un jour, prédiction d'énergie, 4 conseils IA
- [x] `/report` : rapport anonymisé en 4 sections, impression PDF via `window.print()`
- [x] `/coach` : chat qui injecte les 7 derniers jours + les corrélations dans le prompt
- [x] `npm run seed` : 60 jours de données volontairement corrélées
- [x] MongoDB installé, actif, joignable depuis Windows — couche données validée de bout en bout
- [x] Moteur d'analyse vérifié hors UI (`npm run check`) : 5 corrélations fortes retrouvées, dont le café tardif à -0.66
- [ ] **Remplir Supabase + clé IA dans `.env.local`** — seul reste bloquant
- [ ] Manifest PWA

**Si le temps manque demain, on coupe dans cet ordre :** notifications de rappel → manifest PWA → graphique 90 jours.

---

## 9. Pièges déjà rencontrés (ne pas refaire)

| Symptôme | Cause | Correctif appliqué |
|---|---|---|
| `Cannot find name 'LayoutProps'` au `tsc` | type généré par Next dans `.next/types`, absent avant le premier build | typer explicitement `{ children: React.ReactNode }` |
| `Route "/x": Next.js encountered uncached or runtime data during prerendering` | `cacheComponents: true` par défaut en Next 16 : `cookies()` hors `<Suspense>` bloque le prerender | `cacheComponents: false` dans `next.config.ts` (toutes nos pages sont user-specific) |
| `partialPrefetching requires cacheComponents` | les deux options sont liées | supprimer `partialPrefetching` |
| `create-next-app` refuse de démarrer | le dossier s'appelle `web app` : l'espace est un nom npm invalide | scaffold ailleurs puis déplacement ; `package.json` s'appelle `ai-habits` |
| L'inscription reste bloquée | Supabase attend une confirmation par email | décocher « Confirm email » dans le dashboard Supabase |
| `E: Unable to locate package mongodb-org` | Ubuntu 26.04 (`resolute`) : MongoDB n'y publie pas le serveur | pointer le dépôt sur `noble` (24.04) |
| **Les corrélations J+1 renvoyaient le même r que le même-jour** | `new Date("2026-11-13T00:00:00")` est interprété en heure locale puis `toISOString()` reconvertit en UTC : en UTC+1 le `+1 jour` était annulé, `addDays(d, 1) === d` | arithmétique en UTC pur dans `addDays` (`Date.UTC` + `setUTCDate`) |
| `Top-level await is currently not supported with the "cjs" output format` | pas de `"type": "module"` dans `package.json`, tsx compile en CJS | envelopper les scripts dans `async function main()` |
| `EACCES: permission denied 0.0.0.0:3000` | Hyper-V/WSL réserve la plage de ports 2940-3039, qui contient 3000 (`netsh interface ipv4 show excludedportrange protocol=tcp`) | le script `dev` tourne sur **3100**. Libérer 3000 demanderait `net stop winnat` en admin, et la réservation revient au reboot |
| `EADDRINUSE :::3100` | un `npm run dev` tourne déjà | fermer l'autre terminal, ou `npm run dev -- -p 3200` |

---

## 10. Hors périmètre (assumé)

Pas de rôles/admin, pas de reset password, pas de multi-langue, pas d'offline PWA réel (juste le manifest), pas d'upload de fichiers, pas de tests automatisés.
deploy
npm i -g vercel
vercel logs YOUR_DEPLOYMENT_URL
