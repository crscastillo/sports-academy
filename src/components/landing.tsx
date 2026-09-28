"use client";

import Link from "next/link";
import { useState } from "react";
import { content, localePath, type Locale } from "@/lib/landing-content";

function LangSwitch({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-canvas p-0.5 text-xs font-medium">
      {(["es", "en"] as const).map((l) => (
        <Link
          key={l}
          href={localePath[l]}
          className={`rounded-full px-2 py-1 uppercase ${l === locale ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}

export function Landing({ locale }: { locale: Locale }) {
  const t = content[locale];
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href={localePath[locale]} className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-lg">🏀</span>
            <span>Sports Academy</span>
          </Link>
          <nav className="ml-6 hidden flex-1 gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-canvas hover:text-ink">
              {t.nav.features}
            </a>
            <a href="#how-it-works" className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-canvas hover:text-ink">
              {t.nav.how}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LangSwitch locale={locale} />
            <Link href="/login" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-canvas hover:text-ink sm:inline-flex">
              {t.nav.login}
            </Link>
            <Link
              href="/login?mode=register"
              className="inline-flex items-center justify-center rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              {t.nav.signup}
            </Link>
            <button
              className="rounded-lg border border-line px-2.5 py-1.5 text-sm md:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid gap-1 border-t border-line px-4 py-2 md:hidden">
            <a href="#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm">
              {t.nav.features}
            </a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm">
              {t.nav.how}
            </a>
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm">
              {t.nav.login}
            </Link>
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              {t.hero.eyebrow}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              {t.hero.title} <span className="text-brand">{t.hero.highlight}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{t.hero.body}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login?mode=register"
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:w-auto"
              >
                {t.hero.ctaPrimary}
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-line bg-surface px-5 py-3 text-sm font-semibold hover:bg-canvas sm:w-auto"
              >
                {t.hero.ctaSecondary}
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">{t.hero.note}</p>
          </div>

          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
            <span className="font-medium uppercase tracking-wide">{t.logos.label}</span>
            {t.logos.items.map((item) => (
              <span key={item} className="rounded-full border border-line bg-surface px-2.5 py-1">
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-line bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">{t.features.title}</h2>
              <p className="mt-3 text-muted">{t.features.subtitle}</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {t.features.items.map((f) => (
                <div key={f.title} className="rounded-xl border border-line bg-canvas p-5">
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guest links */}
        <section className="py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t.guest.title}</h2>
              <p className="mt-4 text-muted">{t.guest.body}</p>
              <ul className="mt-6 space-y-2.5">
                {t.guest.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-brand">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="rounded-xl border border-line bg-canvas p-4">
                <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-white">🔗</span>
                  <span className="truncate">sports-academy.app/c/8f2a1c…</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-line" />
                  <div className="h-3 w-1/2 rounded bg-line" />
                  <div className="mt-4 flex gap-2">
                    <span className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white">✓</span>
                    <span className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium">✕</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-line bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">{t.how.title}</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {t.how.steps.map((s, i) => (
                <div key={s.title} className="rounded-xl border border-line bg-canvas p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl rounded-2xl bg-brand px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight">{t.cta.title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">{t.cta.body}</p>
            <Link
              href="/login?mode=register"
              className="mt-7 inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-white/90"
            >
              {t.cta.button}
            </Link>
            <p className="mt-3 text-xs text-white/80">{t.cta.note}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px]">🏀</span>
            Sports Academy — {t.footer.tagline}
          </span>
          <span>© {new Date().getFullYear()} Sports Academy. {t.footer.rights}</span>
        </div>
      </footer>
    </div>
  );
}
