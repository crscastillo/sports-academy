"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShieldHalf,
  Users,
  UserRound,
  Dumbbell,
  CalendarDays,
  HandCoins,
  IdCard,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const LINKS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/teams", label: "Equipos", icon: ShieldHalf },
  { href: "/players", label: "Atletas", icon: UserRound },
  { href: "/coaches", label: "Entrenadores", icon: Users },
  { href: "/trainings", label: "Entrenamientos", icon: Dumbbell },
  { href: "/matchdays", label: "Jornadas", icon: CalendarDays },
  { href: "/donations", label: "Donaciones", icon: HandCoins },
  { href: "/staff", label: "Personal", icon: IdCard },
  { href: "/settings", label: "Configuración", icon: Settings },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-bold">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">🏀</span>
      <span>Sports Academy</span>
    </Link>
  );
}

function NavLinks({ active, onNavigate }: { active: (href: string) => boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active(l.href) ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-background hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Nav({ email }: { email: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => path === h || path.startsWith(h + "/");

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-3 md:py-4">
        <div className="px-1 pb-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks active={active} />
        </div>
        <div className="mt-4 border-t border-border px-1 pt-3">
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <form action="/auth/signout" method="post" className="mt-1">
            <button className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <LogOut className="size-3.5" /> Salir
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
        <button className="rounded-lg border border-border p-2" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <Menu className="size-4" />
        </button>
        <Brand />
      </header>

      {/* Mobile menu drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 px-3 py-4 md:hidden">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <Brand />
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <NavLinks active={active} onNavigate={() => setOpen(false)} />
          </div>
          <div className="mt-4 border-t border-border px-1 pt-3">
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <form action="/auth/signout" method="post" className="mt-1">
              <button className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                <LogOut className="size-3.5" /> Salir
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
