import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <ShadTextarea rows={3} {...props} className={cn("w-full px-3 py-2", props.className)} />;
}
