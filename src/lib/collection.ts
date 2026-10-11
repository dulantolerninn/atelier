export type SortMode = "recent" | "name" | "created";

type Sortable = { name?: string; title?: string; created_at: string; updated_at: string };

const label = (item: Sortable) => (item.name ?? item.title ?? "").toLocaleLowerCase("es");

export function filterByName<T extends Sortable>(items: T[], query: string): T[] {
  const needle = query.trim().toLocaleLowerCase("es");
  return needle ? items.filter((item) => label(item).includes(needle)) : items;
}

export function sortItems<T extends Sortable>(items: T[], mode: SortMode): T[] {
  const copy = [...items];
  if (mode === "name") return copy.sort((a, b) => label(a).localeCompare(label(b), "es"));
  const key = mode === "created" ? "created_at" : "updated_at";
  return copy.sort((a, b) => b[key].localeCompare(a[key]));
}
