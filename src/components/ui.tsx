import Link from "next/link";
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Button as ShadButton, buttonVariants } from "@/components/ui/button";
import { Input as ShadInput } from "@/components/ui/input";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import { Badge as ShadBadge } from "@/components/ui/badge";
import {
  Card as ShadCard,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, children, action, className = "" }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <ShadCard className={cn("gap-3 px-4 py-4 sm:px-5", className)}>
      {(title || action) && (
        <CardHeader className="px-0">
          {title && <CardTitle>{title}</CardTitle>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className="px-0">{children}</CardContent>
    </ShadCard>
  );
}

// primary/secondary/danger/ghost map onto shadcn's button variants so existing call sites keep working.
const variantMap = {
  primary: "default",
  secondary: "outline",
  danger: "destructive",
  ghost: "ghost",
} as const;
type Variant = keyof typeof variantMap;

export function Button({
  children, variant = "primary", className = "", ...rest
}: { children: ReactNode; variant?: Variant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ShadButton variant={variantMap[variant]} className={cn("h-9 px-3.5", className)} {...rest}>
      {children}
    </ShadButton>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: Variant }) {
  return (
    <Link href={href} className={buttonVariants({ variant: variantMap[variant], className: "h-9 px-3.5" })}>
      {children}
    </Link>
  );
}

const inputCls = "px-3 py-2";

export function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <ShadInput {...props} className={cn("w-full", inputCls, props.className)} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-input bg-transparent text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
        inputCls,
        props.className
      )}
    >
      {children}
    </select>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <ShadTextarea rows={3} {...props} className={cn("w-full", inputCls, props.className)} />;
}

const badgeTones = {
  gray: "border-border bg-background text-muted-foreground",
  green: "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
  red: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  blue: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  brand: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
};

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return (
    <ShadBadge variant="outline" className={cn("rounded-full font-medium", badgeTones[tone])}>
      {children}
    </ShadBadge>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
