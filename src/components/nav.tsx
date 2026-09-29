"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShieldHalf,
  Users,
  UserRound,
  Dumbbell,
  CalendarDays,
  HandCoins,
  Wallet,
  IdCard,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const BASE_LINKS = [
  { suffix: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { suffix: "teams", label: "Equipos", icon: ShieldHalf },
  { suffix: "players", label: "Atletas", icon: UserRound },
  { suffix: "coaches", label: "Entrenadores", icon: Users },
  { suffix: "trainings", label: "Entrenamientos", icon: Dumbbell },
  { suffix: "matchdays", label: "Jornadas", icon: CalendarDays },
  { suffix: "donations", label: "Donaciones", icon: HandCoins },
];
const PAYMENTS_LINK = { suffix: "payments", label: "Pagos", icon: Wallet };
const TAIL_LINKS = [
  { suffix: "staff", label: "Personal", icon: IdCard },
  { suffix: "settings", label: "Configuración", icon: Settings },
];

function Brand({ slug }: { slug: string }) {
  return (
    <Link href={`/${slug}/dashboard`} className="flex items-center gap-2 font-bold">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">🏀</span>
      <span>Sports Academy</span>
    </Link>
  );
}

function NavLinks({ links, slug, active, onNavigate }: { links: typeof BASE_LINKS; slug: string; active: (href: string) => boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {links.map((l) => {
        const Icon = l.icon;
        const href = `/${slug}/${l.suffix}`;
        return (
          <Link
            key={l.suffix}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active(href) ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-background hover:text-foreground"
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

export function Nav({ email, showPayments = false }: { email: string; showPayments?: boolean }) {
  const path = usePathname();
  const { academySlug } = useParams<{ academySlug: string }>();
  const [open, setOpen] = useState(false);
  const active = (h: string) => path === h || path.startsWith(h + "/");
  const links = [...BASE_LINKS, ...(showPayments ? [PAYMENTS_LINK] : []), ...TAIL_LINKS];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-3 md:py-4">
        <div className="px-1 pb-4">
          <Brand slug={academySlug} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks links={links} slug={academySlug} active={active} />
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
        <Brand slug={academySlug} />
      </header>

      {/* Mobile menu drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 px-3 py-4 md:hidden">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <Brand slug={academySlug} />
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <NavLinks links={links} slug={academySlug} active={active} onNavigate={() => setOpen(false)} />
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
