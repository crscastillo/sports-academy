"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Empty, Input, Select } from "@/components/ui";
import { ageOn, GENDERS } from "@/lib/labels";

export type Row = {
  id: string; first_name: string; last_name: string; jersey_number: number | null; national_id: string | null;
  birth_date: string | null; height_cm: number | null; positions: string[]; active: boolean; gender: string | null;
  team_players: { team: { id: string; name: string; category: string } }[];
};

type TeamOpt = { id: string; name: string; category: string };

export function PlayersTable({ players, teams }: { players: Row[]; teams: TeamOpt[] }) {
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");
  const [gender, setGender] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return players.filter((p) => {
      if (!showInactive && !p.active) return false;
      if (teamId && !p.team_players.some((tp) => tp.team?.id === teamId)) return false;
      if (gender) {
        const genderOk = gender === "mixed" ? !p.gender : p.gender === gender;
        if (!genderOk) return false;
      }
      if (needle) {
        const haystack = `${p.first_name} ${p.last_name} ${p.national_id ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [players, q, teamId, gender, showInactive]);

  return (
    <>
      <p className="mb-4 -mt-4 text-sm text-muted-foreground">{filtered.length} registrados</p>
      <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o cédula" />
          </div>
          <div className="w-48">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Todos los equipos</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2 px-2 text-sm">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Incluir inactivos
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {[{ value: "", label: "Todos" }, ...GENDERS].map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGender(g.value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${gender === g.value ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-background"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty>No hay atletas que coincidan.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th><th className="px-3">Nombre</th><th className="px-3">Cédula</th>
                <th className="px-3">Edad</th><th className="px-3">Estatura</th><th className="px-3">Pos.</th><th className="px-3">Equipos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-background/60">
                  <td className="px-3 py-2 font-mono">{p.jersey_number ?? "—"}</td>
                  <td className="px-3">
                    <Link href={`/players/${p.id}`} className="font-medium hover:underline">{p.first_name} {p.last_name}</Link>
                    {!p.active && <span className="ml-2"><Badge tone="red">Inactivo</Badge></span>}
                  </td>
                  <td className="px-3 text-muted-foreground">{p.national_id ?? "—"}</td>
                  <td className="px-3">{ageOn(p.birth_date) ?? "—"}</td>
                  <td className="px-3">{p.height_cm ? `${p.height_cm} cm` : "—"}</td>
                  <td className="px-3">{p.positions.join(", ") || "—"}</td>
                  <td className="px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.team_players.map((tp) => tp.team && <Badge key={tp.team.id} tone="brand">{tp.team.name}</Badge>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
