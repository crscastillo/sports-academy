import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge as ShadBadge } from "@/components/ui/badge";

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
