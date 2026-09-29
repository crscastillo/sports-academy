"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepositories } from "@/lib/repositories";

function safeNext(raw: FormDataEntryValue | null) {
  const n = String(raw ?? "/dashboard");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export async function registerWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const academyName = String(formData.get("academy_name") ?? "").trim();
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

  try {
    const { academy } = await getRepositories();
    await academy.createAcademy(academyName || null, fullName || null);
  } catch (academyError) {
    const raw = academyError instanceof Error ? academyError.message : String(academyError);
    const message = raw.includes("academy name required") ? "Ingresá el nombre de tu academia" : raw;
    redirect(`/login?mode=register&error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
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
