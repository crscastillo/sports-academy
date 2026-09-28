"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/teams", label: "Equipos" },
  { href: "/players", label: "Atletas" },
  { href: "/trainings", label: "Entrenamientos" },
  { href: "/matchdays", label: "Jornadas" },
  { href: "/donations", label: "Donaciones" },
  { href: "/staff", label: "Personal" },
];

export function Nav({ email }: { email: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand">🏀</span>
          <span className="hidden sm:inline">Sports Academy</span>
        </Link>
        <nav className="hidden flex-1 gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm ${active(l.href) ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-canvas"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted lg:inline">{email}</span>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-canvas">Salir</button>
          </form>
          <button className="rounded-lg border border-line px-2.5 py-1.5 text-sm md:hidden" onClick={() => setOpen(!open)} aria-label="Menú">
            ☰
          </button>
        </div>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-line px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-2 text-sm ${active(l.href) ? "bg-brand/10 font-semibold text-brand" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
