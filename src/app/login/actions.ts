"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: FormDataEntryValue | null) {
  const n = String(raw ?? "/");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function registerWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (password.length < 8) {
    redirect(`/login?mode=register&error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/login?mode=register&error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  if (!data.session) {
    redirect(`/login?error=${encodeURIComponent("Cuenta creada. Ya podés ingresar con tu correo y contraseña.")}&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
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
