import { Search } from "lucide-react";
import type { SortMode } from "@/lib/collection";

export function ListToolbar({ query, onQuery, sort, onSort, placeholder }: { query: string; onQuery: (value: string) => void; sort: SortMode; onSort: (value: SortMode) => void; placeholder: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-muted focus:ring-4 focus:ring-subtle" />
      </div>
      <select value={sort} onChange={(event) => onSort(event.target.value as SortMode)} aria-label="Ordenar por" className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-muted">
        <option value="recent">Más recientes</option>
        <option value="name">Nombre</option>
        <option value="created">Fecha de creación</option>
      </select>
    </div>
  );
}
