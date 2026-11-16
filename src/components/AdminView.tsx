"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACTION_VERB, adminApi, agoLabel, type AdminAction, type AdminStory, type AdminUser, type Page } from "@/lib/admin";
import { colorFor, fmt, whenLabel } from "@/lib/data";
import { atLeast, ROLE_LABEL, type Profile, type Role } from "@/lib/profile";
import { useAuthHref } from "@/lib/useAuthHref";
import { ConfirmDialog } from "./ConfirmDialog";
import { Icon } from "./Icon";
import { Select } from "./Select";
import { useSession } from "./SessionProvider";
import { Loading, Sk } from "./Skeleton";
import { Avatar, Btn, Chip } from "./ui";

type Tab = "personas" | "historias" | "registro";
const RANK: Record<Role, number> = { lector: 0, moderador: 1, admin: 2 };
const ROLE_OPTIONS = (["lector", "moderador", "admin"] as const).map((r) => ({ value: r, label: ROLE_LABEL[r] }));

/** Espera a que dejes de escribir para buscar. */
function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Carga una lista paginada con la sesión. Se rehace cuando cambian los filtros (`key`);
 * "Cargar más" agrega la página siguiente al final.
 */
function usePaged<T>(key: string, load: (offset: number) => Promise<Page<T>>) {
  const [state, setState] = useState<{ key: string; page: Page<T> | null; error: string; more: boolean }>({ key: "", page: null, error: "", more: false });
  useEffect(() => {
    let alive = true;
    load(0)
      .then((page) => { if (alive) setState({ key, page, error: "", more: false }); })
      .catch((err: Error) => { if (alive) setState({ key, page: null, error: err.message, more: false }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` resume los filtros que usa `load`
  }, [key]);

  const current = state.key === key ? state : null;
  async function more() {
    if (!current?.page) return;
    setState((s) => ({ ...s, more: true }));
    try {
      const next = await load(current.page.items.length);
      setState((s) => (s.key === key && s.page ? { ...s, more: false, page: { ...next, items: [...s.page.items, ...next.items] } } : s));
    } catch (err) {
      setState((s) => ({ ...s, more: false, error: (err as Error).message }));
    }
  }
  /** Reemplaza un elemento después de una acción, sin volver a pedir la lista. */
  function replace(match: (item: T) => boolean, next: T | null) {
    setState((s) => (!s.page ? s : {
      ...s,
      page: {
        ...s.page,
        total: next ? s.page.total : s.page.total - 1,
        items: next ? s.page.items.map((i) => (match(i) ? next : i)) : s.page.items.filter((i) => !match(i)),
      },
    }));
  }
  return { page: current?.page ?? null, error: current?.error ?? "", loading: !current, loadingMore: current?.more ?? false, more, replace };
}

function ListSkeleton() {
  return (
    <Loading label="Cargando…" className="stack-sm">
      {[0, 1, 2].map((i) => <div key={i} className="workrow"><Sk w={44} h={44} r={999} /><div className="stack-sm" style={{ flex: 1 }}><Sk w="40%" h={16} /><Sk w="60%" h={14} /></div></div>)}
    </Loading>
  );
}

function MoreButton({ page, loading, onClick }: { page: Page<unknown>; loading: boolean; onClick: () => void }) {
  if (page.items.length >= page.total) return null;
  return <div><Btn variant="ghost" onClick={onClick} disabled={loading}>{loading ? "Cargando…" : `Cargar más (${page.total - page.items.length})`}</Btn></div>;
}

// ----- personas -----

type UserDialog = { kind: "suspend" | "unsuspend" | "delete"; user: AdminUser } | { kind: "role"; user: AdminUser; role: Role };

function People({ me, token }: { me: Profile; token: string }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [estado, setEstado] = useState("");
  const search = useDebounced(q.trim());
  const list = usePaged<AdminUser>(`${search}|${role}|${estado}`, (offset) => adminApi.users(token, { q: search, role, estado, offset }));
  const [dialog, setDialog] = useState<UserDialog | null>(null);
  const isAdmin = me.role === "admin";
  const canModerate = (u: AdminUser) => u.id !== me.id && RANK[u.role] < RANK[me.role];

  return (
    <section className="stack">
      <div className="row wrap admin__filters">
        <label className="searchpill admin__search">
          <Icon name="search" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por @usuario, nombre o correo" aria-label="Buscar personas" />
        </label>
        <Select compact label="Rol" value={role} onChange={setRole} options={[{ value: "", label: "Todos los roles" }, ...ROLE_OPTIONS]} />
        <Select compact label="Estado" value={estado} onChange={setEstado} options={[{ value: "", label: "Todas" }, { value: "activas", label: "Activas" }, { value: "suspendidas", label: "Suspendidas" }]} />
      </div>

      {list.error && <p className="notice notice--error" role="alert">{list.error}</p>}
      {list.loading ? <ListSkeleton /> : list.page && (
        <>
          <p className="muted small" role="status">{list.page.total === 1 ? "1 cuenta" : `${fmt(list.page.total)} cuentas`}</p>
          {list.page.items.length === 0 && <div className="empty"><p className="muted">Nadie coincide con esa búsqueda.</p></div>}
          {list.page.items.map((u) => (
            <article key={u.id} className="workrow admin__row">
              <Avatar letter={u.name[0] ?? "?"} color={colorFor(u.handle)} src={u.avatarUrl} />
              <div className="stack-sm" style={{ flex: "1 1 220px", minWidth: 0 }}>
                <span className="row wrap" style={{ gap: 8 }}>
                  <Link href={`/perfil/${u.handle}`} className="h-card">{u.name}</Link>
                  <span className="muted">@{u.handle}</span>
                  {u.id === me.id && <Chip tone="white">Tú</Chip>}
                </span>
                <span className="muted small admin__meta">
                  {u.email ?? "sin correo"} · {u.stories === 1 ? "1 historia" : `${u.stories} historias`} · entró {agoLabel(u.lastSignInAt)}
                </span>
                {u.suspendedAt && <span className="small admin__reason">Suspendida el {whenLabel(u.suspendedAt)}{u.suspendedReason ? `: ${u.suspendedReason}` : ""}</span>}
              </div>
              <div className="row wrap admin__actions">
                {u.suspendedAt && <Chip tone="sand">Suspendida</Chip>}
                {isAdmin && u.id !== me.id ? (
                  <Select compact label={`Rol de @${u.handle}`} value={u.role} onChange={(r) => r !== u.role && setDialog({ kind: "role", user: u, role: r as Role })} options={ROLE_OPTIONS} />
                ) : (
                  <Chip tone={u.role === "lector" ? "white" : "lilac"}>{ROLE_LABEL[u.role]}</Chip>
                )}
                {canModerate(u) && (u.suspendedAt
                  ? <Btn variant="ghost" size="sm" onClick={() => setDialog({ kind: "unsuspend", user: u })}>Reactivar</Btn>
                  : <Btn variant="ghost" size="sm" onClick={() => setDialog({ kind: "suspend", user: u })}>Suspender</Btn>)}
                {isAdmin && canModerate(u) && <Btn variant="ghost" size="sm" icon="x" onClick={() => setDialog({ kind: "delete", user: u })}>Borrar</Btn>}
              </div>
            </article>
          ))}
          <MoreButton page={list.page} loading={list.loadingMore} onClick={list.more} />
        </>
      )}

      {dialog?.kind === "role" && (
        <ConfirmDialog
          title="Cambiar rol" confirmLabel={`Dar rol de ${ROLE_LABEL[dialog.role]}`} onClose={() => setDialog(null)}
          onConfirm={async () => { list.replace((x) => x.id === dialog.user.id, await adminApi.setRole(token, dialog.user.id, dialog.role)); setDialog(null); }}
        >
          <p>@{dialog.user.handle} pasará de <strong>{ROLE_LABEL[dialog.user.role]}</strong> a <strong>{ROLE_LABEL[dialog.role]}</strong>.</p>
          {dialog.role !== "lector" && <p className="muted small">{dialog.role === "admin" ? "Administración puede moderar, dar roles y borrar cuentas." : "Moderación puede suspender cuentas de lectura y retirar historias."}</p>}
        </ConfirmDialog>
      )}
      {dialog?.kind === "suspend" && (
        <ConfirmDialog
          title={`Suspender a @${dialog.user.handle}`} confirmLabel="Suspender" danger onClose={() => setDialog(null)}
          input={{ label: "Motivo", placeholder: "Qué pasó. Lo verá la persona y queda en el registro.", minLength: 3, maxLength: 300, multiline: true }}
          onConfirm={async (reason) => { list.replace((x) => x.id === dialog.user.id, await adminApi.suspend(token, dialog.user.id, reason)); setDialog(null); }}
        >
          <p>Podrá seguir leyendo, pero no escribir ni publicar. Su perfil y sus historias dejan de verse hasta que la reactives.</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "unsuspend" && (
        <ConfirmDialog
          title={`Reactivar a @${dialog.user.handle}`} confirmLabel="Reactivar" onClose={() => setDialog(null)}
          onConfirm={async () => { list.replace((x) => x.id === dialog.user.id, await adminApi.unsuspend(token, dialog.user.id)); setDialog(null); }}
        >
          <p>Vuelve a poder escribir, y su perfil y sus historias vuelven a verse.</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title={`Borrar la cuenta de @${dialog.user.handle}`} confirmLabel="Borrar para siempre" danger onClose={() => setDialog(null)}
          input={{ label: `Escribe ${dialog.user.handle} para confirmar`, placeholder: dialog.user.handle, mustEqual: dialog.user.handle }}
          onConfirm={async () => { await adminApi.deleteUser(token, dialog.user.id); list.replace((x) => x.id === dialog.user.id, null); setDialog(null); }}
        >
          <p>Se borran su cuenta, su perfil, sus {dialog.user.stories === 1 ? "historia" : `${dialog.user.stories} historias`} con todos los capítulos, su repisa y sus votos. <strong>No se puede deshacer.</strong></p>
          <p className="muted small">Si solo hace falta frenarla, suspenderla es reversible.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}

// ----- historias -----

function Stories({ token }: { token: string }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const search = useDebounced(q.trim());
  const list = usePaged<AdminStory>(`${search}|${estado}`, (offset) => adminApi.stories(token, { q: search, estado, offset }));
  const [dialog, setDialog] = useState<{ kind: "remove" | "restore"; story: AdminStory } | null>(null);

  const status = (s: AdminStory) =>
    s.removedAt ? <Chip tone="sand">Retirada</Chip>
      : s.authorSuspended ? <Chip tone="sand">Autora suspendida</Chip>
        : s.published && s.chapters > 0 ? <Chip>Publicada</Chip> : <Chip tone="lilac">Borrador</Chip>;

  return (
    <section className="stack">
      <div className="row wrap admin__filters">
        <label className="searchpill admin__search">
          <Icon name="search" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por título o @autora" aria-label="Buscar historias" />
        </label>
        <Select compact label="Estado" value={estado} onChange={setEstado} options={[{ value: "", label: "Todas" }, { value: "visibles", label: "Sin retirar" }, { value: "retiradas", label: "Retiradas" }]} />
      </div>

      {list.error && <p className="notice notice--error" role="alert">{list.error}</p>}
      {list.loading ? <ListSkeleton /> : list.page && (
        <>
          <p className="muted small" role="status">{list.page.total === 1 ? "1 historia" : `${fmt(list.page.total)} historias`}</p>
          {list.page.items.length === 0 && <div className="empty"><p className="muted">Ninguna historia coincide.</p></div>}
          {list.page.items.map((s) => (
            <article key={s.slug} className="workrow admin__row">
              <span className="admin__spine" style={{ background: s.color, color: s.ink }} aria-hidden="true">{s.title[0]}</span>
              <div className="stack-sm" style={{ flex: "1 1 220px", minWidth: 0 }}>
                <span className="row wrap" style={{ gap: 8 }}>
                  {s.published && !s.removedAt && !s.authorSuspended && s.chapters > 0
                    ? <Link href={`/historia/${s.slug}`} className="h-card">{s.title}</Link>
                    : <span className="h-card">{s.title}</span>}
                  <Link href={`/perfil/${s.author}`} className="muted">@{s.author}</Link>
                </span>
                <span className="muted small">{s.rating} · {s.chapters === 1 ? "1 capítulo" : `${s.chapters} capítulos`} · {fmt(s.reads)} lecturas · actualizada {agoLabel(s.updatedAt)}</span>
                {s.removedAt && <span className="small admin__reason">Retirada el {whenLabel(s.removedAt)}{s.removedReason ? `: ${s.removedReason}` : ""}</span>}
              </div>
              <div className="row wrap admin__actions">
                {status(s)}
                {s.removedAt
                  ? <Btn variant="ghost" size="sm" onClick={() => setDialog({ kind: "restore", story: s })}>Restaurar</Btn>
                  : <Btn variant="ghost" size="sm" onClick={() => setDialog({ kind: "remove", story: s })}>Retirar</Btn>}
              </div>
            </article>
          ))}
          <MoreButton page={list.page} loading={list.loadingMore} onClick={list.more} />
        </>
      )}

      {dialog?.kind === "remove" && (
        <ConfirmDialog
          title={`Retirar «${dialog.story.title}»`} confirmLabel="Retirar" danger onClose={() => setDialog(null)}
          input={{ label: "Motivo", placeholder: "Por qué se retira. Lo verá la autora.", minLength: 3, maxLength: 300, multiline: true }}
          onConfirm={async (reason) => {
            const r = await adminApi.removeStory(token, dialog.story.slug, reason);
            list.replace((x) => x.slug === dialog.story.slug, { ...dialog.story, removedAt: r.removedAt, removedReason: reason });
            setDialog(null);
          }}
        >
          <p>Deja de verse en Inkwell. @{dialog.story.author} la sigue viendo con el motivo y se puede restaurar cuando quieras.</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "restore" && (
        <ConfirmDialog
          title={`Restaurar «${dialog.story.title}»`} confirmLabel="Restaurar" onClose={() => setDialog(null)}
          onConfirm={async () => {
            await adminApi.restoreStory(token, dialog.story.slug);
            list.replace((x) => x.slug === dialog.story.slug, { ...dialog.story, removedAt: null, removedReason: null });
            setDialog(null);
          }}
        >
          <p>Vuelve a verse si su autora la tiene publicada.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}

// ----- registro -----

function Log({ token }: { token: string }) {
  const [state, setState] = useState<{ items: AdminAction[] | null; error: string }>({ items: null, error: "" });
  useEffect(() => {
    let alive = true;
    adminApi.actions(token)
      .then((items) => { if (alive) setState({ items, error: "" }); })
      .catch((err: Error) => { if (alive) setState({ items: [], error: err.message }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se pide una vez al abrir la pestaña
  }, []);

  if (state.error) return <p className="notice notice--error" role="alert">{state.error}</p>;
  if (!state.items) return <ListSkeleton />;
  if (!state.items.length) return <div className="empty"><p className="muted">Todavía no hay acciones de moderación.</p></div>;
  return (
    <ol className="stack-sm admin__log">
      {state.items.map((a) => (
        <li key={a.id} className="workrow">
          <div className="stack-sm" style={{ flex: 1, minWidth: 0 }}>
            <span><strong>{a.actor}</strong> {ACTION_VERB[a.action] ?? a.action} <strong>{a.targetLabel}</strong></span>
            {a.detail && <span className="muted small">{a.action === "rol" ? a.detail.replace(/\b(lector|moderador|admin)\b/g, (r) => ROLE_LABEL[r as Role]) : `Motivo: ${a.detail}`}</span>}
          </div>
          <time className="muted small" dateTime={a.createdAt}>{whenLabel(a.createdAt)}</time>
        </li>
      ))}
    </ol>
  );
}

// ----- página -----

/** Panel de moderación y administración. Lo que cada rol puede hacer lo decide la API; aquí solo se esconde lo que no aplica. */
export function AdminView() {
  const { ready, session, token, profile, profileError } = useSession();
  const auth = useAuthHref();
  const [tab, setTab] = useState<Tab>("personas");

  if (!ready || (session && !profile && !profileError)) return <ListSkeleton />;
  if (!session || !token) {
    return <div className="empty"><h1 className="h-sec">Entra para continuar</h1><Btn href={auth.entrar}>Entrar</Btn></div>;
  }
  if (!profile) return <p className="notice notice--error" role="alert">{profileError}</p>;
  if (!atLeast(profile.role, "moderador")) {
    return <div className="empty"><h1 className="h-sec">Esta sección es de moderación</h1><p className="muted">Tu cuenta no tiene permiso para entrar aquí.</p><Btn href="/">Ir al inicio</Btn></div>;
  }

  const tabs: { id: Tab; label: string }[] = [{ id: "personas", label: "Personas" }, { id: "historias", label: "Historias" }, { id: "registro", label: "Registro" }];
  return (
    <div className="stack-lg">
      <div className="row between wrap end">
        <div>
          <h1 className="h-hero">Administración</h1>
          <p className="muted">Entraste con rol de {ROLE_LABEL[profile.role]}.{profile.role === "moderador" ? " Puedes suspender cuentas de lectura y retirar historias." : ""}</p>
        </div>
      </div>
      <div className="tabs" role="group" aria-label="Secciones">
        {tabs.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "personas" && <People me={profile} token={token} />}
      {tab === "historias" && <Stories token={token} />}
      {tab === "registro" && <Log token={token} />}
    </div>
  );
}
