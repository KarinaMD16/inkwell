import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { colorFor, notifications } from "@/lib/data";

export const metadata: Metadata = { title: "Novedades" };

export default function Novedades() {
  return (
    <div className="stack-lg narrow">
      <h1 className="h-hero">Novedades</h1>
      <p className="notice" role="status">Estas novedades son de muestra: las notificaciones reales llegan cuando la API las tenga.</p>
      <ul className="notifs">
        {notifications.map((n) => (
          <li key={n.text}>
            <Link href={n.href} className={n.unread ? "is-unread" : ""}>
              <Avatar letter={n.who[0]} color={colorFor(n.who)} />
              <span style={{ flex: 1, minWidth: 0 }}><span>{n.text}</span><span className="muted small" style={{ display: "block" }}>{n.when}</span></span>
              {n.unread && <span className="dot" role="img" aria-label="Sin leer" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
