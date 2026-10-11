import { ReactNode } from "react";

export function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`grid size-8 place-items-center rounded-lg text-muted transition hover:bg-subtle ${danger ? "hover:text-danger" : "hover:text-fg"}`}>
      {children}
    </button>
  );
}
