import { describe, expect, it } from "vitest";
import { filterByName, sortItems } from "./collection";

const items = [
  { name: "Zeta", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-03-01T00:00:00Z" },
  { name: "álamo", created_at: "2026-02-01T00:00:00Z", updated_at: "2026-01-15T00:00:00Z" },
  { title: "Beta", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-02-10T00:00:00Z" },
];

describe("filterByName", () => {
  it("filtra sin distinguir mayúsculas y usa name o title", () => {
    expect(filterByName(items, "BET")).toHaveLength(1);
    expect(filterByName(items, "  ")).toHaveLength(3);
    expect(filterByName(items, "xyz")).toHaveLength(0);
  });
});

describe("sortItems", () => {
  it("ordena por recientes, creación y nombre (con acentos)", () => {
    expect(sortItems(items, "recent").map((i) => i.name ?? i.title)).toEqual(["Zeta", "Beta", "álamo"]);
    expect(sortItems(items, "created").map((i) => i.name ?? i.title)).toEqual(["Beta", "álamo", "Zeta"]);
    expect(sortItems(items, "name").map((i) => i.name ?? i.title)).toEqual(["álamo", "Beta", "Zeta"]);
  });

  it("no modifica la lista original", () => {
    const copy = [...items];
    sortItems(items, "name");
    expect(items).toEqual(copy);
  });
});
