"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: FormDataEntryValue | null) {
  const n = String(raw ?? "/");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent("No se pudo enviar el enlace. Intentá de nuevo en un minuto.")}&next=${encodeURIComponent(next)}`);
  }
  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent("Correo o contraseña incorrectos")}&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}
