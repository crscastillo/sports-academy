import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepositories } from "@/lib/repositories";
import { Nav } from "@/components/nav";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { academy: academyRepo } = await getRepositories();
  const isStaff = await academyRepo.isStaff();
  if (!isStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-bold">Sin acceso</h1>
          <p className="text-sm text-muted-foreground">
            La cuenta {user.email} no está registrada como personal de la academia. Pedí a un administrador que te agregue.
          </p>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-primary underline">Salir</button>
          </form>
        </div>
      </main>
    );
  }

  const academy = await academyRepo.getSettings();

  return (
    <div className="md:flex">
      <Nav email={user.email ?? ""} showPayments={academy?.track_payments ?? false} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
