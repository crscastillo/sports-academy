"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, variant = "primary", className = "" }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; className?: string }) {
  const { pending } = useFormStatus();
  const v =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-dark"
      : variant === "danger"
        ? "border border-red-300 bg-surface text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        : "border border-line bg-surface hover:bg-canvas";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${v} ${className}`}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}

export function ConfirmSubmit({ children, message = "¿Seguro?" }: { children: ReactNode; message?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-surface px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
    >
      {children}
    </button>
  );
}

export function ShareLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input readOnly value={url} className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-xs" />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-dark"
      >
        {copied ? "¡Copiado!" : label}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-canvas"
      >
        WhatsApp
      </a>
    </div>
  );
}

export function AutoSubmitForm({ action, children, className = "" }: { action: (fd: FormData) => Promise<void>; children: ReactNode; className?: string }) {
  return (
    <form action={action} className={className} onChange={(e) => e.currentTarget.requestSubmit()}>
      {children}
    </form>
  );
}
