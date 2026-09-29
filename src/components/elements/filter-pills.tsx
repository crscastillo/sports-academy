"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A row of toggle pills for a single-value filter. Pass `hrefFor` for a
 * server-page, URL-driven filter (renders `<Link>`s, causing a real
 * navigation/refetch); pass `onSelect` for a client-side filter (renders
 * `<button>`s that just update local state).
 */
export function FilterPills<T extends string>({
  options, value, onSelect, hrefFor,
}: {
  options: { value: T; label: string }[];
  value: T;
  onSelect?: (v: T) => void;
  hrefFor?: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = value === o.value;
        const className = cn(
          "rounded-lg px-3 py-1.5 text-sm",
          active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-background",
        );
        return hrefFor ? (
          <Link key={o.value} href={hrefFor(o.value)} className={className}>
            {o.label}
          </Link>
        ) : (
          <button key={o.value} type="button" onClick={() => onSelect?.(o.value)} className={className}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
