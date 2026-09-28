import Link from "next/link";
import { registerWithPassword, signInWithPassword } from "./actions";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/client";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const isRegister = sp.mode === "register";
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-2xl">🏀</div>
          <h1 className="text-xl font-bold">Sports Academy</h1>
          <p className="text-sm text-muted">
            {isRegister ? "Creá tu academia" : "Acceso para entrenadores y administradores"}
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

        {isRegister ? (
          <form action={registerWithPassword} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <Field label="Nombre de la academia"><Input name="academy_name" required autoComplete="organization" /></Field>
            <Field label="Tu nombre"><Input name="full_name" autoComplete="name" /></Field>
            <Field label="Correo"><Input type="email" name="email" required autoComplete="email" /></Field>
            <Field label="Contraseña"><Input type="password" name="password" required autoComplete="new-password" minLength={8} /></Field>
            <SubmitButton className="w-full">Crear academia</SubmitButton>
          </form>
        ) : (
          <form action={signInWithPassword} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <Field label="Correo"><Input type="email" name="email" required autoComplete="email" /></Field>
            <Field label="Contraseña"><Input type="password" name="password" required autoComplete="current-password" /></Field>
            <SubmitButton className="w-full">Ingresar</SubmitButton>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          {isRegister ? (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand underline">
                Ingresá
              </Link>
            </>
          ) : (
            <>
              ¿No tenés cuenta?{" "}
              <Link href={`/login?mode=register&next=${encodeURIComponent(next)}`} className="text-brand underline">
                Registrate
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
