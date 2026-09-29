"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { Badge, Card, Empty, Input, Select } from "@/components/ui";
import { FilterPills } from "@/components/elements/filter-pills";
import { ageOn, GENDERS } from "@/lib/labels";
import { paths } from "@/lib/paths";
import { AgeGenderChart } from "./age-gender-chart";
import { AgeGenderRadarChart } from "./age-gender-radar-chart";

export type Row = {
  id: string; first_name: string; last_name: string; jersey_number: number | null; national_id: string | null;
  birth_date: string | null; height_cm: number | null; positions: string[]; active: boolean; gender: string | null;
  avatar_url: string | null;
  team_players: { team: { id: string; name: string; category: string; gender: string } }[];
};

type TeamOpt = { id: string; name: string; category: string };

const SORTERS: Record<string, (a: Row, b: Row) => number> = {
  name: (a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name),
  jersey: (a, b) => (a.jersey_number ?? Infinity) - (b.jersey_number ?? Infinity),
  age_asc: (a, b) => (ageOn(a.birth_date) ?? -Infinity) - (ageOn(b.birth_date) ?? -Infinity),
  age_desc: (a, b) => (ageOn(b.birth_date) ?? -Infinity) - (ageOn(a.birth_date) ?? -Infinity),
  height: (a, b) => (b.height_cm ?? -Infinity) - (a.height_cm ?? -Infinity),
};

const SORT_OPTIONS = [
  { value: "name", label: "Nombre (A-Z)" },
  { value: "jersey", label: "Dorsal" },
  { value: "age_asc", label: "Edad (menor a mayor)" },
  { value: "age_desc", label: "Edad (mayor a menor)" },
  { value: "height", label: "Estatura (mayor a menor)" },
];

export function PlayersTable({ players, teams }: { players: Row[]; teams: TeamOpt[] }) {
  const { academySlug } = useParams<{ academySlug: string }>();
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");
  const [gender, setGender] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState("name");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return players
      .filter((p) => {
        if (!showInactive && !p.active) return false;
        if (teamId && !p.team_players.some((tp) => tp.team?.id === teamId)) return false;
        if (gender) {
          const genderOk =
            gender === "mixed" ? p.team_players.some((tp) => tp.team?.gender === "mixed") : p.gender === gender;
          if (!genderOk) return false;
        }
        if (needle) {
          const haystack = `${p.first_name} ${p.last_name} ${p.national_id ?? ""} ${p.jersey_number ?? ""}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort(SORTERS[sortBy]);
  }, [players, q, teamId, gender, showInactive, sortBy]);

  return (
    <>
      <p className="mb-4 -mt-4 text-sm text-muted-foreground">{filtered.length} registrados</p>
      <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, cédula o dorsal" />
          </div>
          <div className="w-48">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Todos los equipos</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div className="w-52">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Ordenar por: {o.label}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2 px-2 text-sm">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Incluir inactivos
          </label>
        </div>
        <div className="mt-3">
          <FilterPills options={[{ value: "", label: "Todos" }, ...GENDERS]} value={gender} onSelect={setGender} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty>No hay atletas que coincidan.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-11 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Nombre</th>
                <th className="px-3 py-2.5">Cédula</th>
                <th className="px-3 py-2.5">Edad</th>
                <th className="px-3 py-2.5">Estatura</th>
                <th className="px-3 py-2.5">Posiciones</th>
                <th className="px-3 py-2.5">Equipos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border transition-colors hover:bg-background/60">
                  <td className="py-2.5 pl-3">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
                      {p.avatar_url ? (
                        <Image src={p.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{p.jersey_number ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <Link href={paths.players.detail(academySlug, p.id)} className="font-medium hover:underline">{p.first_name} {p.last_name}</Link>
                    {!p.active && <span className="ml-2"><Badge tone="red">Inactivo</Badge></span>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.national_id ?? "—"}</td>
                  <td className="px-3 py-2.5">{ageOn(p.birth_date) ?? "—"}</td>
                  <td className="px-3 py-2.5">{p.height_cm ? `${p.height_cm} cm` : "—"}</td>
                  <td className="px-3 py-2.5">{p.positions.join(", ") || "—"}</td>
                  <td className="px-3 py-2.5">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Edad y género · atletas activos">
          <AgeGenderChart players={filtered} genderFilter={gender} />
        </Card>

        <Card title="Edad y género · telaraña">
          <AgeGenderRadarChart players={filtered} genderFilter={gender} />
        </Card>
      </div>
    </>
  );
}
