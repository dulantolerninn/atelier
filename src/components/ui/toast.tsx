"use client";

import { useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastItem = { id: number; kind: "success" | "error"; text: string };

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => items;
const empty: ToastItem[] = [];

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function toast(text: string, kind: ToastItem["kind"] = "success") {
  const id = nextId++;
  items = [...items, { id, kind, text }];
  emit();
  window.setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3500);
}

export const toastError = (error: unknown, fallback = "Ocurrió un error.") =>
  toast(error instanceof Error && error.message ? `${fallback} ${error.message}` : fallback, "error");

export function Toaster() {
  const current = useSyncExternalStore(subscribe, snapshot, () => empty);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {current.map((item) => (
        <div key={item.id} role={item.kind === "error" ? "alert" : "status"} className="pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg shadow-lg">
          {item.kind === "error" ? <AlertCircle size={17} className="mt-0.5 shrink-0 text-danger" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-muted" />}
          <span className="min-w-0 flex-1 break-words">{item.text}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss(item.id)} className="rounded p-0.5 text-muted hover:text-fg"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}
