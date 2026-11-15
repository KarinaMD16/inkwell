"use client";

import { useState } from "react";
import { MiniBook } from "./Book";
import { Icon, type IconName } from "./Icon";
import { Btn } from "./ui";

const PICKS: { label: string; color: string; ink: string; icon: IconName }[] = [
  { label: "Romance", color: "#DD5D4F", ink: "#14152B", icon: "heart" }, { label: "Fanfic", color: "#FF8FAB", ink: "#14152B", icon: "star" },
  { label: "AU", color: "#B9A5F0", ink: "#14152B", icon: "sparkle" }, { label: "Fantasía", color: "#4B3B8F", ink: "#FFFBF8", icon: "sword" },
  { label: "Misterio", color: "#14152B", ink: "#FFFBF8", icon: "moon" }, { label: "Terror", color: "#D7F0EC", ink: "#14152B", icon: "ghost" },
  { label: "Sci-fi", color: "#2EC4B6", ink: "#14152B", icon: "rocket" }, { label: "Redes sociales", color: "#F28C38", ink: "#14152B", icon: "at" },
  { label: "Humor", color: "#FFD9A8", ink: "#14152B", icon: "smile" }, { label: "Amistad", color: "#F6C453", ink: "#14152B", icon: "chat" },
];

export function OnboardingPicker() {
  const [on, setOn] = useState<string[]>([]);
  const toggle = (l: string) => setOn((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));
  const enough = on.length >= 3;
  return (
    <>
      <div className="picks">
        {PICKS.map((p) => {
          const sel = on.includes(p.label);
          return (
            <button key={p.label} type="button" className={`pick${sel ? " is-on" : ""}`} aria-pressed={sel} onClick={() => toggle(p.label)}>
              {sel && <span className="pick__check"><Icon name="check" size={14} stroke={2.6} /></span>}
              <MiniBook color={p.color} ink={p.ink} icon={p.icon} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
      <div className="row between wrap">
        <strong>{on.length === 0 ? "Elige al menos tres" : `${on.length} ${on.length === 1 ? "elegida" : "elegidas"}`}</strong>
        {enough ? <Btn href="/" icon="arrow" size="lg">Continuar</Btn> : <Btn icon="arrow" size="lg" disabled>Continuar</Btn>}
      </div>
    </>
  );
}
