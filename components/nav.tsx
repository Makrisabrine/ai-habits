import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signOut } from "@/actions/auth";

const LINKS = [
  { href: "/habits", label: "Habitudes" },
  { href: "/devices", label: "Appareils" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/insights", label: "Insights IA" },
  { href: "/report", label: "Rapport" },
  { href: "/coach", label: "Coach" },
];

export async function Nav() {
  const user = await getUser();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-white/10 bg-brand-950/95 text-white shadow-lg shadow-brand-950/10 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center gap-3">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <Image
              src="/app-icon.svg"
              alt=""
              width={42}
              height={42}
              className="rounded-xl transition-transform group-hover:rotate-3 group-hover:scale-105"
            />
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-white sm:text-base">
                Athar Habits
              </span>
              <span className="block text-[9px] font-bold tracking-[0.3em] text-brand-300">
                &amp; SYMPTOMS
              </span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2 text-xs sm:gap-4 sm:text-sm">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="rounded-lg px-2 py-2 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  Profil
                </Link>
                <form action={signOut}>
                  <button className="rounded-lg px-2 py-2 text-slate-300 hover:bg-white/10 hover:text-white">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="px-2 py-2 text-slate-300 hover:text-white">
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 hover:bg-brand-500"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>

        {user && (
          <ul className="flex gap-1 overflow-x-auto pb-3 text-sm text-slate-300">
            {LINKS.map((link) => (
              <li key={link.href} className="shrink-0">
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2 whitespace-nowrap hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
