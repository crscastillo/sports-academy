"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const submitVariantMap = { primary: "default", secondary: "outline", danger: "destructive" } as const;

export function SubmitButton({ children, variant = "primary", className = "" }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={submitVariantMap[variant]} className={cn("h-9 px-3.5", className)}>
      {pending ? "Guardando…" : children}
    </Button>
  );
}

export function ConfirmSubmit({ children, message = "¿Seguro?" }: { children: ReactNode; message?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant="destructive"
      size="sm"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}

export function ShareLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input readOnly value={url} className="min-w-0 flex-1 px-3 py-2 text-xs" />
      <Button
        type="button"
        className="h-auto px-3 py-2 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "¡Copiado!" : label}
      </Button>
      <Button variant="outline" className="h-auto px-3 py-2 text-xs" render={<a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" />}>
        WhatsApp
      </Button>
    </div>
  );
}

export function AvatarPicker({ name = "avatar", defaultUrl }: { name?: string; defaultUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- live blob: preview before upload, next/image can't render blob URLs
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserRound className="size-8 text-muted-foreground" />
        )}
      </div>
      <div>
        <input
          type="file"
          name={name}
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-background"
        />
        <p className="mt-1 text-xs text-muted-foreground">JPG o PNG, máx 5MB.</p>
      </div>
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
