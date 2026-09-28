import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { str } from "@/lib/form";

export const metadata = { title: "Personal" };

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
  const { data: staff } = await supabase.from("staff").select("email, full_name, created_at").order("created_at");
  return (
    <>
      <PageHeader title="Personal" subtitle="Entrenadores y administradores con acceso a la app" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Con acceso" className="lg:col-span-2">
          <ul className="divide-y divide-line">
            {staff?.map((s) => (
              <li key={s.email} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{s.full_name ?? s.email}</span>
                  {s.full_name && <span className="text-muted"> · {s.email}</span>}
                </span>
                <form action={removeStaff.bind(null, s.email)}>
                  <button className="text-xs text-muted hover:text-red-600">Quitar</button>
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
            <p className="text-xs text-muted">La persona ingresa con un enlace que recibe en ese correo.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
