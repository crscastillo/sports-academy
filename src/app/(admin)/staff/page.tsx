import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { AutoSubmitForm, ShareLink, SubmitButton } from "@/components/client";
import { bool, str } from "@/lib/form";

export const metadata = { title: "Personal" };

async function setAcademyPublic(fd: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: academy } = await supabase.from("academies").select("id").single();
  if (!academy) return;
  const { error } = await supabase.from("academies").update({ is_public: bool(fd, "is_public") }).eq("id", academy.id);
  if (error) throw new Error(error.message);
  revalidatePath("/staff");
}

async function addStaff(fd: FormData) {
  "use server";
  const email = str(fd, "email")?.toLowerCase();
  if (!email) return;
  const supabase = await createClient();
  const { error } = await supabase.from("staff").upsert({ email, full_name: str(fd, "full_name") });
  if (error) throw new Error(error.message);
  revalidatePath("/staff");
}

async function removeStaff(email: string) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() === email.toLowerCase()) throw new Error("No podés quitarte a vos mismo.");
  await supabase.from("staff").delete().eq("email", email);
  revalidatePath("/staff");
}

export default async function StaffPage() {
  const supabase = await createClient();
  const [{ data: staff }, { data: academy }] = await Promise.all([
    supabase.from("staff").select("email, full_name, created_at").order("created_at"),
    supabase.from("academies").select("slug, is_public").single(),
  ]);
  return (
    <>
      <PageHeader title="Personal" subtitle="Entrenadores y administradores con acceso a la app" />

      {academy && (
        <Card title="Página pública de la academia" className="mb-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Una página de solo lectura con las jornadas próximas y los resultados anteriores. No muestra atletas ni datos de contacto.
          </p>
          <AutoSubmitForm action={setAcademyPublic} className="mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_public" defaultChecked={academy.is_public} className="accent-[var(--brand)]" />
              Página pública activa
            </label>
          </AutoSubmitForm>
          {academy.is_public && <ShareLink path={`/a/${academy.slug}`} label="Copiar link" />}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Con acceso" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {staff?.map((s) => (
              <li key={s.email} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{s.full_name ?? s.email}</span>
                  {s.full_name && <span className="text-muted-foreground"> · {s.email}</span>}
                </span>
                <form action={removeStaff.bind(null, s.email)}>
                  <button className="text-xs text-muted-foreground hover:text-red-600">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Agregar persona">
          <form action={addStaff} className="space-y-3">
            <Field label="Correo"><Input type="email" name="email" required /></Field>
            <Field label="Nombre"><Input name="full_name" /></Field>
            <SubmitButton>Dar acceso</SubmitButton>
            <p className="text-xs text-muted-foreground">La persona se registra con ese correo y una contraseña en la página de ingreso.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
