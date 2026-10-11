"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

const FOCUSABLE = 'button:not([disabled]),input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])';

export function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.stopPropagation(); closeRef.current(); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, []);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        {children}
      </div>
    </div>
  );
}

const secondaryButton = "rounded-lg px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-fg";
const primaryButton = "flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-60";

export function PromptDialog({ title, description, initial = "", placeholder, submitLabel, onSubmit, onClose }: { title: string; description?: string; initial?: string; placeholder?: string; submitLabel: string; onSubmit: (value: string) => Promise<void>; onClose: () => void }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const clean = value.trim();
    if (!clean || busy) return;
    setBusy(true);
    try { await onSubmit(clean); } finally { setBusy(false); }
  }

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <form onSubmit={submit}>
        <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} maxLength={120} placeholder={placeholder} aria-label={title} className="mt-5 w-full rounded-xl border border-line bg-app px-3 py-2.5 text-fg outline-none focus:border-muted focus:ring-4 focus:ring-subtle" />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancelar</button>
          <button disabled={!value.trim() || busy} className={primaryButton}>{busy && <LoaderCircle size={15} className="animate-spin" />}{submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onClose }: { title: string; description: string; confirmLabel: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  }

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" autoFocus onClick={onClose} className={secondaryButton}>Cancelar</button>
        <button type="button" disabled={busy} onClick={confirm} className="flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">{busy && <LoaderCircle size={15} className="animate-spin" />}{confirmLabel}</button>
      </div>
    </Modal>
  );
}
