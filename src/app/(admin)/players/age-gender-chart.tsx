"use client";

import { useMemo, useState } from "react";
import { ageOn } from "@/lib/labels";
import { useElementSize } from "./use-element-size";

type Player = { birth_date: string | null; gender: string | null; active: boolean };
type Point = { age: number; x: number; y: number; count: number };

const LABEL = { male: "Masculino", female: "Femenino" } as const;

// Catmull-Rom -> cubic Bezier, so the line passes through every point smoothly
// instead of a jagged polyline.
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function AgeGenderChart({ players, genderFilter }: { players: Player[]; genderFilter?: string }) {
  const [hoverAge, setHoverAge] = useState<number | null>(null);
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>({ width: 720, height: 288 });

  // A gender filter of "male" or "female" narrows the chart to that one line —
  // "" (todos) or "mixed" (mixed teams can hold either gender) keep both.
  const genders: ("male" | "female")[] =
    genderFilter === "male" || genderFilter === "female" ? [genderFilter] : ["male", "female"];

  const left = 24;
  const right = 60;
  const top = 20;
  const bottom = 28;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const { ages, series } = useMemo(() => {
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

    const xFor = (i: number) => (ages.length > 1 ? left + (i / (ages.length - 1)) * plotWidth : left + plotWidth / 2);
    const yFor = (count: number) => top + plotHeight - (maxCount > 0 ? (count / maxCount) * plotHeight : 0);

    const series = genders.map((gender) => {
      const points: Point[] = ages.map((age, i) => {
        const count = counts.get(`${age}-${gender}`) ?? 0;
        return { age, x: xFor(i), y: yFor(count), count };
      });
      return { gender, points };
    });

    return { ages, series };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `genders` is derived fresh from genderFilter each render; including it would just re-run this every render for the same effective value.
  }, [players, genderFilter, plotWidth, plotHeight]);

  if (ages.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos suficientes para mostrar edades y género.</p>;
  }

  const hoverIndex = hoverAge != null ? ages.indexOf(hoverAge) : -1;

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
        <span className="ml-auto text-xs text-muted-foreground">Atletas activos por edad{genders.length === 1 && ` · ${LABEL[genders[0]]}`}</span>
      </div>

      <div ref={containerRef} className="relative h-72 w-full">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label="Cantidad de atletas activos por edad y género">
          <line x1={left} y1={top + plotHeight} x2={width - right} y2={top + plotHeight} stroke="var(--grid)" strokeWidth={1} />

          {ages.map((age, i) => {
            const x = ages.length > 1 ? left + (i / (ages.length - 1)) * plotWidth : left + plotWidth / 2;
            return (
              <text key={age} x={x} y={height - 8} textAnchor="middle" className="text-[11px]" style={{ fill: "var(--text-muted)" }}>
                {age}
              </text>
            );
          })}

          {hoverIndex >= 0 && (
            <line
              x1={series[0].points[hoverIndex].x}
              y1={top}
              x2={series[0].points[hoverIndex].x}
              y2={top + plotHeight}
              stroke="var(--grid)"
              strokeWidth={1}
            />
          )}

          {series.map((s) => {
            const baseline = top + plotHeight;
            const areaPath = `${smoothPath(s.points)} L${s.points[s.points.length - 1].x},${baseline} L${s.points[0].x},${baseline} Z`;
            return <path key={`${s.gender}-area`} d={areaPath} fill={`var(--series-${s.gender})`} opacity={0.1} stroke="none" />;
          })}

          {series.map((s) => (
            <path key={s.gender} d={smoothPath(s.points)} fill="none" stroke={`var(--series-${s.gender})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {series.map((s) => {
            const last = s.points[s.points.length - 1];
            return (
              <text key={`${s.gender}-label`} x={last.x + 10} y={last.y + 4} className="text-[11px] font-semibold" style={{ fill: "var(--text-secondary)" }}>
                {last.count}
              </text>
            );
          })}

          <rect
            x={left}
            y={top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={(e) => {
              const svg = e.currentTarget.ownerSVGElement;
              if (!svg) return;
              const pt = svg.createSVGPoint();
              pt.x = e.clientX;
              const ctm = svg.getScreenCTM();
              if (!ctm) return;
              const local = pt.matrixTransform(ctm.inverse());
              const ratio = ages.length > 1 ? (local.x - left) / plotWidth : 0;
              const idx = Math.max(0, Math.min(ages.length - 1, Math.round(ratio * (ages.length - 1))));
              setHoverAge(ages[idx]);
            }}
            onPointerLeave={() => setHoverAge(null)}
          />
        </svg>

        {hoverIndex >= 0 && (
          <div
            className="pointer-events-none absolute rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${(series[0].points[hoverIndex].x / width) * 100}%`, top: 0, transform: "translate(-50%, -4px)" }}
          >
            <div className="mb-0.5 font-semibold text-foreground">{hoverAge} años</div>
            {series.map((s) => (
              <div key={s.gender} className="flex items-center gap-1.5 text-muted-foreground">
                <span className="inline-block h-0.5 w-2.5 rounded-full" style={{ background: `var(--series-${s.gender})` }} />
                {LABEL[s.gender]}: <span className="font-medium text-foreground">{s.points[hoverIndex].count}</span>
              </div>
            ))}
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
              {ages.flatMap((age, i) =>
                series.map((s) => (
                  <tr key={`${age}-${s.gender}`} className="border-t border-border">
                    <td className="px-2 py-1">{age}</td>
                    <td className="px-2 py-1">{LABEL[s.gender]}</td>
                    <td className="px-2 py-1">{s.points[i].count}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
