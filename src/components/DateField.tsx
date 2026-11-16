"use client";

import { useEffect, useState } from "react";
import { Select, type Option } from "./Select";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const pad = (n: number | string) => String(n).padStart(2, "0");

/**
 * Fecha en tres listas (día, mes, año) en lugar del calendario nativo: para una fecha de
 * nacimiento es más rápido que retroceder mes a mes. Entrega "AAAA-MM-DD" cuando está completa.
 */
export function DateField({ name, label, invalid, describedBy, onChange, defaultValue }: {
  name: string; label: string; invalid?: boolean; describedBy?: string; onChange?: (iso: string) => void;
  /** Fecha inicial "AAAA-MM-DD". */
  defaultValue?: string | null;
}) {
  const initial = /^(\d{4})-(\d{2})-(\d{2})$/.exec(defaultValue ?? "");
  const [day, setDay] = useState(initial ? String(Number(initial[3])) : "");
  const [month, setMonth] = useState(initial ? String(Number(initial[2])) : "");
  const [year, setYear] = useState(initial ? initial[1] : "");
  // El año actual se lee en el navegador, no al generar la página.
  const [thisYear, setThisYear] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al montar
    setThisYear(new Date().getFullYear());
  }, []);

  const daysInMonth = month ? new Date(Number(year) || 2000, Number(month), 0).getDate() : 31;
  const days: Option[] = Array.from({ length: daysInMonth }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
  const months: Option[] = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));
  const years: Option[] = thisYear ? Array.from({ length: 100 }, (_, i) => ({ value: String(thisYear - i), label: String(thisYear - i) })) : [];
  const iso = day && month && year ? `${year}-${pad(month)}-${pad(day)}` : "";

  function set(part: "d" | "m" | "y", v: string) {
    const next = { d: day, m: month, y: year, [part]: v };
    // Si el día ya no cabe en el mes elegido (31 → febrero), se ajusta al último día.
    const max = next.m ? new Date(Number(next.y) || 2000, Number(next.m), 0).getDate() : 31;
    if (Number(next.d) > max) next.d = String(max);
    setDay(next.d); setMonth(next.m); setYear(next.y);
    onChange?.(next.d && next.m && next.y ? `${next.y}-${pad(next.m)}-${pad(next.d)}` : "");
  }

  return (
    <div className="datefield" role="group" aria-label={label}>
      <input type="hidden" name={name} value={iso} />
      <Select label="Día" placeholder="Día" value={day} onChange={(v) => set("d", v)} options={days} invalid={invalid} describedBy={describedBy} />
      <Select label="Mes" placeholder="Mes" value={month} onChange={(v) => set("m", v)} options={months} invalid={invalid} describedBy={describedBy} />
      <Select label="Año" placeholder="Año" value={year} onChange={(v) => set("y", v)} options={years} invalid={invalid} describedBy={describedBy} disabled={!thisYear} />
    </div>
  );
}
