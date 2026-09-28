import Link from "next/link";
import { Badge, Card, Input } from "@/components/ui";
import { AutoSubmitForm, ConfirmSubmit, SubmitButton } from "@/components/client";
import { CALLUP_STATUS, TRANSPORT, formatTime, genderLabel } from "@/lib/labels";
import { callUpPlayers, deleteMatch, removeCallup, setAttendance, setCallupResponse, updateMatch } from "../actions";

type PlayerLite = { id: string; first_name: string; last_name: string; jersey_number: number | null };

export type MatchRow = {
  id: string; opponent: string; start_time: string | null; court: string | null;
  score_for: number | null; score_against: number | null; notes: string | null;
  team: { id: string; name: string; category: string; gender: string; team_players: { player: PlayerLite & { active: boolean } }[] } | null;
  callups: {
    id: string; status: string; transport: string | null; guest_note: string | null; responded_at: string | null;
    attended: boolean | null; player: PlayerLite & { guardian_phone: string | null };
  }[];
};

export function MatchBlock({ match: m, matchdayId }: { match: MatchRow; matchdayId: string }) {
  const called = new Set(m.callups.map((c) => c.player.id));
  const notCalled = (m.team?.team_players ?? []).map((tp) => tp.player).filter((p) => p && p.active && !called.has(p.id));
  const callups = [...m.callups].sort(
    (a, b) => (a.player.jersey_number ?? 999) - (b.player.jersey_number ?? 999) || a.player.last_name.localeCompare(b.player.last_name),
  );
  const conf = callups.filter((c) => c.status === "confirmed").length;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{m.team?.category}</Badge>
            <span className="font-semibold">{m.team?.name}</span>
            <span className="text-muted">vs</span>
            <span className="font-semibold">{m.opponent}</span>
          </div>
          <div className="mt-1 text-sm text-muted">
            {formatTime(m.start_time)} {m.court && `· ${m.court}`} · {genderLabel(m.team?.gender)} · {conf}/{callups.length} confirmados
            {m.score_for != null && m.score_against != null && (
              <span className="ml-2 font-semibold text-ink">
                {m.score_for}–{m.score_against} {m.score_for > m.score_against ? "✅" : m.score_for < m.score_against ? "❌" : "➖"}
              </span>
            )}
          </div>
        </div>
      </div>

      {callups.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr><th className="py-1.5 pr-2">#</th><th className="pr-2">Atleta</th><th className="pr-2">Confirmación</th><th className="pr-2">Asistió</th><th /></tr>
            </thead>
            <tbody>
              {callups.map((c) => (
                <tr key={c.id} className="border-t border-line align-top">
                  <td className="py-2 pr-2 font-mono">{c.player.jersey_number ?? "—"}</td>
                  <td className="py-2 pr-2">
                    <Link href={`/players/${c.player.id}`} className="hover:underline">{c.player.first_name} {c.player.last_name}</Link>
                    {c.guest_note && <div className="text-xs text-muted">“{c.guest_note}”</div>}
                  </td>
                  <td className="py-2 pr-2">
                    <AutoSubmitForm key={`${c.status}-${c.transport}`} action={setCallupResponse.bind(null, c.id, matchdayId)} className="flex flex-wrap items-center gap-1">
                      <select name="status" defaultValue={c.status} className={`rounded-md border px-1.5 py-1 text-xs ${c.status === "confirmed" ? "border-green-300 bg-green-50 dark:bg-green-950" : c.status === "declined" ? "border-red-300 bg-red-50 dark:bg-red-950" : "border-amber-300 bg-amber-50 dark:bg-amber-950"}`}>
                        {Object.entries(CALLUP_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      {c.status === "confirmed" && (
                        <select name="transport" defaultValue={c.transport ?? ""} className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs">
                          <option value="">¿Transporte?</option>
                          {Object.entries(TRANSPORT).map(([v, l]) => <option key={v} value={v}>{v === "bus" ? "🚌 " : "🚗 "}{l}</option>)}
                        </select>
                      )}
                    </AutoSubmitForm>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-1">
                      <form action={setAttendance.bind(null, c.id, matchdayId, c.attended === true ? null : true)}>
                        <button title="Asistió" className={`rounded-md border px-2 py-0.5 text-xs ${c.attended === true ? "border-green-500 bg-green-500 text-white" : "border-line"}`}>✓</button>
                      </form>
                      <form action={setAttendance.bind(null, c.id, matchdayId, c.attended === false ? null : false)}>
                        <button title="Ausente" className={`rounded-md border px-2 py-0.5 text-xs ${c.attended === false ? "border-red-500 bg-red-500 text-white" : "border-line"}`}>✗</button>
                      </form>
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <form action={removeCallup.bind(null, c.id, matchdayId)}>
                      <button className="text-xs text-muted hover:text-red-600" title="Quitar de la convocatoria">✕</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-medium">Convocar más atletas ({notCalled.length} disponibles)</summary>
          {notCalled.length === 0 ? (
            <p className="mt-2 text-xs text-muted">Todo el plantel activo está convocado.</p>
          ) : (
            <form action={callUpPlayers.bind(null, m.id, matchdayId)} className="mt-2 space-y-2">
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {notCalled.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="player_id" value={p.id} className="accent-[var(--brand)]" />
                    {p.jersey_number != null && <span className="font-mono text-xs">#{p.jersey_number}</span>} {p.first_name} {p.last_name}
                  </label>
                ))}
              </div>
              <SubmitButton variant="secondary">Convocar</SubmitButton>
            </form>
          )}
        </details>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-medium">Editar partido / resultado</summary>
          <form action={updateMatch.bind(null, m.id, matchdayId)} className="mt-2 grid grid-cols-2 gap-2">
            <Input name="opponent" defaultValue={m.opponent} placeholder="Rival" className="col-span-2" />
            <Input type="time" name="start_time" defaultValue={m.start_time?.slice(0, 5) ?? ""} />
            <Input name="court" defaultValue={m.court ?? ""} placeholder="Cancha" />
            <Input type="number" name="score_for" defaultValue={m.score_for ?? ""} placeholder="Puntos nuestros" />
            <Input type="number" name="score_against" defaultValue={m.score_against ?? ""} placeholder="Puntos rival" />
            <Input name="notes" defaultValue={m.notes ?? ""} placeholder="Notas del partido" className="col-span-2" />
            <div className="col-span-2 flex items-center justify-between">
              <SubmitButton variant="secondary">Guardar</SubmitButton>
            </div>
          </form>
          <form action={deleteMatch.bind(null, m.id, matchdayId)} className="mt-2">
            <ConfirmSubmit message="¿Eliminar este partido y su convocatoria?">Eliminar partido</ConfirmSubmit>
          </form>
        </details>
      </div>
    </Card>
  );
}
