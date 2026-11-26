import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

const FEATURES = [
  {
    number: "01",
    title: "Un suivi qui reste simple",
    description: "Note sommeil, énergie, stress et habitudes en quelques instants.",
  },
  {
    number: "02",
    title: "Deux suivis bien séparés",
    description: "Retrouve tes tendances de bien-être et d’usage des appareils au même endroit.",
  },
  {
    number: "03",
    title: "Des tendances plus lisibles",
    description: "Visualise tes courbes et comprends comment évoluent tes journées.",
  },
];

export default async function Home() {
  if (await getUser()) redirect("/habits");

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-brand-950 px-6 py-10 text-white shadow-2xl shadow-brand-950/15 sm:px-10 sm:py-12 lg:px-14">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-28 -z-10 size-96 rounded-full bg-brand-600/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-1/3 -z-10 size-96 rounded-full bg-brand-400/15 blur-3xl"
        />
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-brand-300">
              <span className="size-2 rounded-full bg-brand-400" />
              TON ESPACE BIEN-ÊTRE
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Comprends ce qui fait varier ton énergie.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Suis tes habitudes et ton temps d’écran séparément. Des courbes claires t’aident à
              repérer tes tendances, jour après jour.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 hover:-translate-y-0.5 hover:bg-brand-500"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-medium text-white hover:bg-white/10"
              >
                J’ai déjà un compte
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-400">
              Tes données restent privées et liées à ton compte.
            </p>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <Image
              src="/athar-habits-logo.svg"
              alt="Athar Habits & Symptoms — Comprends ton énergie, anticipe tes baisses."
              width={960}
              height={360}
              priority
              className="h-auto w-full rounded-2xl shadow-2xl shadow-black/20"
            />
          </div>
        </div>
      </section>

      <section aria-label="Fonctionnalités" className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <article
            key={feature.number}
            className="card rounded-2xl border bg-white/90 p-5 backdrop-blur-sm sm:p-6"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-600">
              {feature.number}
            </span>
            <h2 className="mt-4 font-semibold text-brand-950">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
