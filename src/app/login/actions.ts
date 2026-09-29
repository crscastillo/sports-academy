"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepositories } from "@/lib/repositories";
import { paths } from "@/lib/paths";

/** Root-relative explicit deep link, if one was actually provided — no slug-guessing default. */
function safeNext(raw: FormDataEntryValue | null) {
  const n = raw == null ? "" : String(raw);
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

/** Where a signed-in user lands with no explicit `next` — their own academy's dashboard,
 * or a placeholder slug for the (rare) non-staff case, since the admin layout's "Sin acceso"
 * screen renders before it ever looks at the slug segment. */
async function defaultLanding() {
  const { academy } = await getRepositories();
  const slug = await academy.getSlug().catch(() => "_");
  return paths.dashboard(slug);
}

export async function registerWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const academyName = String(formData.get("academy_name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));

  if (password.length < 8) {
    redirect(`/login?mode=register&error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres")}&next=${encodeURIComponent(next ?? "")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/login?mode=register&error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next ?? "")}`);
  }
  if (!data.session) {
    redirect(`/login?error=${encodeURIComponent("Cuenta creada. Ya podés ingresar con tu correo y contraseña.")}&next=${encodeURIComponent(next ?? "")}`);
  }

  try {
    const { academy } = await getRepositories();
    await academy.createAcademy(academyName || null, fullName || null, slug || null);
  } catch (academyError) {
    const raw = academyError instanceof Error ? academyError.message : String(academyError);
    const message = raw.includes("academy name required") ? "Ingresá el nombre de tu academia" : raw;
    redirect(`/login?mode=register&error=${encodeURIComponent(message)}&next=${encodeURIComponent(next ?? "")}`);
  }
  redirect(next ?? (await defaultLanding()));
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent("Correo o contraseña incorrectos")}&next=${encodeURIComponent(next ?? "")}`);
  }
  redirect(next ?? (await defaultLanding()));
}
