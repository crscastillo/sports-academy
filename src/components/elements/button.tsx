import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button as ShadButton, buttonVariants } from "@/components/ui/button";

// primary/secondary/danger/ghost map onto shadcn's button variants so existing call sites keep working.
const variantMap = {
  primary: "default",
  secondary: "outline",
  danger: "destructive",
  ghost: "ghost",
} as const;
export type ButtonVariant = keyof typeof variantMap;

export function Button({
  children, variant = "primary", className = "", ...rest
}: { children: ReactNode; variant?: ButtonVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ShadButton variant={variantMap[variant]} className={cn("h-9 px-3.5", className)} {...rest}>
      {children}
    </ShadButton>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: ButtonVariant }) {
  return (
    <Link href={href} className={buttonVariants({ variant: variantMap[variant], className: "h-9 px-3.5" })}>
      {children}
    </Link>
  );
}
