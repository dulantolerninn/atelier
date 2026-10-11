"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Cloud, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then((module) => module.Excalidraw), { ssr: false, loading: () => <div className="grid h-full place-items-center"><LoaderCircle className="animate-spin text-zinc-600" /></div> });

type Scene = { elements?: readonly unknown[] } | null;
type Board = { id: string; title: string; scene: Scene };
type SceneElement = { id?: string; version?: number };

const signature = (elements: readonly unknown[] = []) => (elements as SceneElement[]).map((element) => `${element.id}:${element.version}`).join("|");

export function BoardCanvas({ board, onBack, onSaved }: { board: Board; onBack: () => void; onSaved: (id: string, scene: Scene) => void }) {
  const supabase = useMemo(createClient, []);
  const [state, setState] = useState<"saved" | "saving" | "error">("saved");
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<readonly unknown[] | null>(null);
  const lastSaved = useRef(signature(board.scene?.elements));
  const onSavedRef = useRef(onSaved);
  useEffect(() => { onSavedRef.current = onSaved; }, [onSaved]);

  const persist = useCallback(async () => {
    const elements = pending.current;
    if (!elements) return;
    pending.current = null;
    const { error } = await supabase.from("boards").update({ scene: { elements }, updated_at: new Date().toISOString() }).eq("id", board.id);
    if (error) { pending.current ??= elements; setState("error"); return; }
    onSavedRef.current(board.id, { elements });
    if (!pending.current) setState("saved");
  }, [board.id, supabase]);

  const save = useCallback((elements: readonly unknown[]) => {
    const next = signature(elements);
    if (next === lastSaved.current) return;
    lastSaved.current = next;
    pending.current = elements;
    setState("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persist(), 850);
  }, [persist]);

  // Al salir de la pizarra se guarda lo pendiente en lugar de descartarlo.
  useEffect(() => () => { window.clearTimeout(timer.current); void persist(); }, [persist]);

  return <main className="h-screen w-screen"><Excalidraw initialData={{ elements: board.scene?.elements as never[] ?? [] }} onChange={(elements) => save(elements)} renderTopRightUI={() => <div className="flex items-center gap-2 rounded-lg bg-white/90 p-1.5 shadow-sm"><button onClick={onBack} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"><ArrowLeft size={15} /> Proyecto</button><span className="hidden max-w-40 truncate border-l border-zinc-200 pl-2 text-xs font-medium text-zinc-700 sm:block">{board.title}</span><span className="hidden items-center gap-1.5 border-l border-zinc-200 pl-2 text-xs text-zinc-400 md:flex">{state === "saving" ? <><Cloud size={14} /> Guardando…</> : state === "error" ? <>No se pudo guardar</> : <><Check size={14} className="text-zinc-600" /> Guardado</>}</span></div>} /></main>;
}
