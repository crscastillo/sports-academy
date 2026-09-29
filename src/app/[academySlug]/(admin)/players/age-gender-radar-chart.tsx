"use client";

import { useMemo, useState } from "react";
import { ageOn } from "@/lib/labels";
import { useElementSize } from "./use-element-size";

type Player = { birth_date: string | null; gender: string | null; active: boolean };
type Vertex = { age: number; gender: "male" | "female"; count: number; x: number; y: number };

const LABEL = { male: "Masculino", female: "Femenino" } as const;

export function AgeGenderRadarChart({ players, genderFilter }: { players: Player[]; genderFilter?: string }) {
  const [hover, setHover] = useState<Vertex | null>(null);
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>({ width: 320, height: 320 });

  // Same narrowing as the line chart: a single-gender filter shows one web, not two.
  const genders: ("male" | "female")[] =
    genderFilter === "male" || genderFilter === "female" ? [genderFilter] : ["male", "female"];

  // The SVG fills the full measured box, but the web itself stays a circle: its
  // radius is capped by the smaller dimension so a wide/short card doesn't ovalize it.
  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(width, height) / 2 - 32;

  const { ages, series, rings, axisLabels } = useMemo(() => {
    const counts = new Map<string, number>();
    const agesSet = new Set<number>();
    for (const p of players) {
      if (!p.active || !p.birth_date) continue;
      if (p.gender !== "male" && p.gender !== "female") continue;
      if (!genders.includes(p.gender)) continue;
      const age = ageOn(p.birth_date);
      if (age == null) continue;
      agesSet.add(age);
      const key = `${age}-${p.gender}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const ages = [...agesSet].sort((a, b) => a - b);
    let maxCount = 0;
    for (const count of counts.values()) if (count > maxCount) maxCount = count;

    const n = ages.length;
    const angleFor = (i: number) => -Math.PI / 2 + (i / n) * 2 * Math.PI;
    const pointFor = (i: number, r: number) => ({ x: cx + r * Math.cos(angleFor(i)), y: cy + r * Math.sin(angleFor(i)) });

    const series = genders.map((gender) => {
      const points: Vertex[] = ages.map((age, i) => {
        const count = counts.get(`${age}-${gender}`) ?? 0;
        const r = maxCount > 0 ? (count / maxCount) * outerR : 0;
        const { x, y } = pointFor(i, r);
        return { age, gender, count, x, y };
      });
      return { gender, points };
    });

    const rings = [0.33, 0.66, 1].map((f) => ({
      f,
      path: ages
        .map((_, i) => {
          const { x, y } = pointFor(i, outerR * f);
          return `${i === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" ") + " Z",
    }));

    const axisLabels = ages.map((age, i) => {
      const { x, y } = pointFor(i, outerR + 18);
      return { age, x, y };
    });

    return { ages, series, rings, axisLabels };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `genders` is derived fresh from genderFilter each render.
  }, [players, genderFilter, cx, cy, outerR]);

  if (ages.length < 3) {
    return <p className="text-sm text-muted-foreground">Se necesitan al menos 3 edades distintas para dibujar la telaraña.</p>;
  }

  const n = ages.length;
  const angleFor = (i: number) => -Math.PI / 2 + (i / n) * 2 * Math.PI;

  return (
    <div className="viz-root">
      <style>{`
        .viz-root {
          --series-male: #2a78d6;
          --series-female: #eb6834;
          --text-secondary: #52514e;
          --text-muted: #898781;
          --grid: #e1e0d9;
          --surface: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .viz-root {
            --series-male: #3987e5;
            --series-female: #d95926;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --grid: #2c2c2a;
            --surface: #1e1b18;
          }
        }
        :root[data-theme="dark"] .viz-root {
          --series-male: #3987e5;
          --series-female: #d95926;
          --text-secondary: #c3c2b7;
          --text-muted: #898781;
          --grid: #2c2c2a;
          --surface: #1e1b18;
        }
      `}</style>

      <div className="mb-3 flex items-center gap-4 text-sm">
        {genders.length > 1 &&
          genders.map((g) => (
            <span key={g} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: `var(--series-${g})` }} /> {LABEL[g]}
            </span>
          ))}
        <span className="ml-auto text-xs text-muted-foreground">Edad por radio · cantidad por eje{genders.length === 1 && ` · ${LABEL[genders[0]]}`}</span>
      </div>

      <div ref={containerRef} className="relative h-72 w-full">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label="Telaraña de cantidad de atletas activos por edad y género">
          {rings.map((ring) => (
            <path key={ring.f} d={ring.path} fill="none" stroke="var(--grid)" strokeWidth={1} />
          ))}

          {ages.map((_, i) => {
            const angle = angleFor(i);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + outerR * Math.cos(angle)}
                y2={cy + outerR * Math.sin(angle)}
                stroke="var(--grid)"
                strokeWidth={1}
              />
            );
          })}

          {axisLabels.map((label) => (
            <text key={label.age} x={label.x} y={label.y + 4} textAnchor="middle" className="text-[11px]" style={{ fill: "var(--text-muted)" }}>
              {label.age}
            </text>
          ))}

          {series.map((s) => (
            <path
              key={`${s.gender}-fill`}
              d={s.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z"}
              fill={`var(--series-${s.gender})`}
              opacity={0.1}
              stroke="none"
            />
          ))}
          {series.map((s) => (
            <path
              key={`${s.gender}-line`}
              d={s.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z"}
              fill="none"
              stroke={`var(--series-${s.gender})`}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}

          {series.map((s) =>
            s.points.map((p) => (
              <g key={`${s.gender}-${p.age}`}>
                <circle cx={p.x} cy={p.y} r={4} fill={`var(--series-${s.gender})`} stroke="var(--surface)" strokeWidth={2} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={12}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${LABEL[p.gender]}, ${p.age} años: ${p.count} atleta${p.count === 1 ? "" : "s"}`}
                  onPointerEnter={() => setHover(p)}
                  onPointerLeave={() => setHover((h) => (h === p ? null : h))}
                  onFocus={() => setHover(p)}
                  onBlur={() => setHover((h) => (h === p ? null : h))}
                  className="cursor-default outline-none"
                />
              </g>
            )),
          )}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${(hover.x / width) * 100}%`, top: `${(hover.y / height) * 100}%`, transform: "translate(-50%, -130%)" }}
          >
            <div className="font-semibold text-foreground">{hover.count} atleta{hover.count === 1 ? "" : "s"}</div>
            <div className="text-muted-foreground">{LABEL[hover.gender]} · {hover.age} años</div>
          </div>
        )}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-primary">Ver como tabla</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground uppercase">
              <tr><th className="px-2 py-1 text-left">Edad</th><th className="px-2 py-1 text-left">Género</th><th className="px-2 py-1 text-left">Cantidad</th></tr>
            </thead>
            <tbody>
              {series.flatMap((s) => s.points).sort((a, b) => a.age - b.age || a.gender.localeCompare(b.gender)).map((p) => (
                <tr key={`${p.gender}-${p.age}`} className="border-t border-border">
                  <td className="px-2 py-1">{p.age}</td>
                  <td className="px-2 py-1">{LABEL[p.gender]}</td>
                  <td className="px-2 py-1">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
