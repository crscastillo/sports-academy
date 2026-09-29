import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Input as ShadInput } from "@/components/ui/input";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <ShadInput {...props} className={cn("w-full px-3 py-2", props.className)} />;
}
