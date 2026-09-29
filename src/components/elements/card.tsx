import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card as ShadCard, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";

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
