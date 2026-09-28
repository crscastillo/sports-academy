import { sendMagicLink, signInWithPassword } from "./actions";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/client";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const sent = typeof sp.sent === "string" ? sp.sent : null;
  const next = typeof sp.next === "string" ? sp.next : "/";
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-2xl">🏀</div>
          <h1 className="text-xl font-bold">Sports Academy</h1>
          <p className="text-sm text-muted">Acceso para entrenadores y administradores</p>
        </div>

        {sent ? (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
            Te enviamos un enlace a <strong>{sent}</strong>. Abrilo desde este mismo navegador para ingresar.
          </p>
        ) : (
          <form action={sendMagicLink} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <Field label="Correo">
              <Input type="email" name="email" required autoComplete="email" />
            </Field>
            <SubmitButton className="w-full">Enviarme enlace de acceso</SubmitButton>
          </form>
        )}

        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

        <details className="text-sm">
          <summary className="cursor-pointer text-center text-muted">Ingresar con contraseña</summary>
          <form action={signInWithPassword} className="mt-3 space-y-3">
            <input type="hidden" name="next" value={next} />
            <Field label="Correo"><Input type="email" name="email" required autoComplete="email" /></Field>
            <Field label="Contraseña"><Input type="password" name="password" required autoComplete="current-password" /></Field>
            <SubmitButton variant="secondary" className="w-full">Ingresar</SubmitButton>
          </form>
        </details>
      </div>
    </main>
  );
}
