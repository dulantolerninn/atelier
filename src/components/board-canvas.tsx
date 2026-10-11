"use client";

import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Cloud, CloudOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { saveScene, touchProject } from "@/lib/data";
import { buildScene, contentSignature, viewKey } from "@/lib/scene";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import type { Board, BoardSummary, Scene, ViewState } from "@/lib/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toastError } from "@/components/ui/toast";

const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then((module) => module.Excalidraw), { ssr: false, loading: () => <div className="grid h-full place-items-center"><LoaderCircle className="animate-spin text-muted" /></div> });

type SaveState = "saved" | "saving" | "error" | "conflict";

const CONTENT_DELAY = 850;
const VIEW_DELAY = 5000;
const RETRY_DELAY = 5000;
const TOUCH_INTERVAL = 60_000;
const KEEPALIVE_LIMIT = 60_000;

export function BoardCanvas({ board, siblings, projectName }: { board: Board; siblings: BoardSummary[]; projectName: string }) {
  const db = createClient();
  const { theme } = useTheme();
  const [status, setStatusState] = useState<SaveState>("saved");
  const [menuOpen, setMenuOpen] = useState(false);

  const statusRef = useRef<SaveState>("saved");
  const timer = useRef<number | undefined>(undefined);
  const dueAt = useRef(0);
  const pending = useRef<Scene | null>(null);
  const busy = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const known = useRef({ updatedAt: board.updated_at, content: contentSignature(board.scene), view: viewKey(board.scene?.appState) });
  const last = useRef<{ elements?: readonly unknown[]; files?: unknown }>({});
  const lastTouch = useRef(0);
  const token = useRef<string | null>(null);
  const flushRef = useRef<(force?: boolean) => Promise<void>>(async () => {});

  const setStatus = useCallback((next: SaveState) => { statusRef.current = next; setStatusState(next); }, []);

  const schedule = useCallback((delay: number) => {
    const due = Date.now() + delay;
    if (timer.current !== undefined && due >= dueAt.current) return;
    window.clearTimeout(timer.current);
    dueAt.current = due;
    timer.current = window.setTimeout(() => { timer.current = undefined; void flushRef.current(); }, delay);
  }, []);

  /** Guarda lo pendiente. Las llamadas se encolan para que nunca haya dos escrituras a la vez. */
  const flush = useCallback((force = false) => {
    queue.current = queue.current.then(async () => {
      const scene = pending.current;
      if (!scene || (statusRef.current === "conflict" && !force)) return;
      pending.current = null;
      busy.current = true;
      try {
        const result = await saveScene(db, board.id, scene, known.current.updatedAt, force);
        if (result.conflict) { pending.current ??= scene; setStatus("conflict"); return; }
        known.current.updatedAt = result.updatedAt;
        if (Date.now() - lastTouch.current > TOUCH_INTERVAL) { lastTouch.current = Date.now(); void touchProject(db, board.project_id); }
        setStatus(pending.current ? "saving" : "saved");
      } catch (failure) {
        pending.current ??= scene;
        if (statusRef.current !== "error") toastError(failure, "No se pudo guardar la pizarra.");
        setStatus("error");
        schedule(RETRY_DELAY);
      } finally {
        busy.current = false;
      }
    });
    return queue.current;
  }, [board.id, board.project_id, db, schedule, setStatus]);

  useEffect(() => { flushRef.current = flush; }, [flush]);

  const handleChange = useCallback((elements: readonly unknown[], view: ViewState, files: Record<string, unknown>) => {
    const viewChanged = viewKey(view) !== known.current.view;
    const sourceChanged = elements !== last.current.elements || files !== last.current.files;
    last.current = { elements, files };
    if (!viewChanged && !sourceChanged) return;

    const scene = buildScene(elements, view, files);
    const content = sourceChanged ? contentSignature(scene) : known.current.content;
    const contentChanged = content !== known.current.content;
    // Una escena antigua sin vista guardada: se adopta la vista actual sin forzar un guardado.
    const adoptView = known.current.view === "";
    if (!contentChanged && (adoptView || !viewChanged)) { known.current.view = viewKey(view); return; }

    known.current = { ...known.current, content, view: viewKey(view) };
    pending.current = scene;
    if (statusRef.current === "conflict") return;
    setStatus("saving");
    schedule(contentChanged ? CONTENT_DELAY : VIEW_DELAY);
  }, [schedule, setStatus]);

  // Al salir de la pizarra se guarda lo pendiente en lugar de descartarlo.
  useEffect(() => () => { window.clearTimeout(timer.current); timer.current = undefined; void flushRef.current(); }, []);

  // Al cerrar la pestaña: aviso si hay cambios sin guardar y, si caben, un último envío en segundo plano.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/boards?id=eq.${board.id}`;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (pending.current || busy.current) event.preventDefault();
    }

    function onPageHide() {
      const scene = pending.current;
      if (!scene || !token.current || statusRef.current === "conflict") return;
      const body = JSON.stringify({ scene });
      if (body.length > KEEPALIVE_LIMIT) return;
      void fetch(`${endpoint}&updated_at=eq.${encodeURIComponent(known.current.updatedAt)}`, {
        method: "PATCH", keepalive: true, body,
        headers: { apikey: key, Authorization: `Bearer ${token.current}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      });
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    db.auth.getSession().then(({ data }) => { token.current = data.session?.access_token ?? null; });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => { token.current = session?.access_token ?? null; });
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      subscription.unsubscribe();
    };
  }, [board.id, db]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const initialData = useMemo(() => {
    const scene = board.scene;
    const view = scene?.appState;
    return {
      elements: scene?.elements ?? [],
      files: scene?.files ?? {},
      appState: view ? { scrollX: view.scrollX, scrollY: view.scrollY, zoom: view.zoom } : undefined,
      scrollToContent: !view && Boolean(scene?.elements?.length),
    } as never;
  }, [board.scene]);

  return (
    <div className="flex h-dvh flex-col bg-app text-fg">
      <header className="relative z-30 flex h-11 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 sm:px-3">
        <Link href={`/pizarras/${board.project_id}`} aria-label="Volver al proyecto" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-subtle hover:text-fg">
          <ArrowLeft size={16} /><span className="hidden max-w-40 truncate sm:inline">{projectName || "Proyecto"}</span>
        </Link>
        <span className="text-muted" aria-hidden="true">/</span>
        <div className="relative min-w-0">
          <button type="button" aria-haspopup="listbox" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-subtle">
            <span className="truncate">{board.title}</span><ChevronDown size={15} className="shrink-0 text-muted" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onMouseDown={() => setMenuOpen(false)} />
              <ul role="listbox" aria-label="Pizarras del proyecto" className="absolute left-0 top-full z-30 mt-1 max-h-72 w-64 max-w-[80vw] overflow-auto rounded-xl border border-line bg-surface p-1 shadow-lg">
                {siblings.map((item) => (
                  <li key={item.id} role="option" aria-selected={item.id === board.id}>
                    <Link href={`/pizarras/${item.project_id}/${item.id}`} onClick={() => setMenuOpen(false)} className={`block truncate rounded-lg px-3 py-2 text-sm hover:bg-subtle ${item.id === board.id ? "font-semibold" : "text-muted"}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <SaveIndicator status={status} />
          <ThemeToggle />
        </div>
      </header>

      {status === "conflict" && (
        <div role="alert" className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-subtle px-4 py-2.5 text-sm">
          <span className="flex items-center gap-2"><TriangleAlert size={16} className="shrink-0 text-danger" />Esta pizarra se modificó desde otra pestaña o dispositivo. Tus últimos cambios no se han guardado.</span>
          <span className="flex gap-2">
            <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium hover:border-muted">Cargar la versión guardada</button>
            <button type="button" onClick={() => { setStatus("saving"); void flush(true); }} className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg hover:opacity-90">Sobrescribir con mi versión</button>
          </span>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <Excalidraw initialData={initialData} theme={theme} langCode="es-ES" onChange={(elements, appState, files) => handleChange(elements, appState, files)} />
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveState }) {
  const info = {
    saved: { icon: <Check size={14} />, text: "Guardado" },
    saving: { icon: <Cloud size={14} />, text: "Guardando…" },
    error: { icon: <CloudOff size={14} className="text-danger" />, text: "Sin guardar · reintentando" },
    conflict: { icon: <TriangleAlert size={14} className="text-danger" />, text: "Conflicto" },
  }[status];
  return <span role="status" aria-live="polite" className="flex items-center gap-1.5 px-2 text-xs text-muted">{info.icon}<span className="hidden md:inline">{info.text}</span><span className="sr-only md:hidden">{info.text}</span></span>;
}
