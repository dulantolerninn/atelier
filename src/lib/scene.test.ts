import { describe, expect, it } from "vitest";
import { buildScene, contentSignature, viewKey, viewSignature } from "./scene";

const view = { scrollX: 10, scrollY: -20, zoom: { value: 1.5 } };

describe("buildScene", () => {
  it("descarta elementos borrados y conserva la vista", () => {
    const scene = buildScene([{ id: "a", version: 1 }, { id: "b", version: 2, isDeleted: true }], view);
    expect(scene.elements).toEqual([{ id: "a", version: 1 }]);
    expect(scene.appState).toEqual(view);
  });

  it("solo conserva las imágenes que siguen en uso", () => {
    const scene = buildScene([{ id: "a", fileId: "f1" }], view, { f1: { id: "f1" }, f2: { id: "f2" } });
    expect(Object.keys(scene.files ?? {})).toEqual(["f1"]);
  });
});

describe("contentSignature", () => {
  it("cambia al editar un elemento", () => {
    const before = contentSignature({ elements: [{ id: "a", version: 1 }] });
    const after = contentSignature({ elements: [{ id: "a", version: 2 }] });
    expect(before).not.toBe(after);
  });

  it("ignora la vista y los elementos borrados", () => {
    const one = buildScene([{ id: "a", version: 1 }], view);
    const two = buildScene([{ id: "a", version: 1 }, { id: "b", version: 1, isDeleted: true }], { ...view, scrollX: 999 });
    expect(contentSignature(one)).toBe(contentSignature(two));
  });

  it("tolera escenas vacías o nulas", () => {
    expect(contentSignature(null)).toBe(contentSignature({ elements: [] }));
  });
});

describe("viewKey", () => {
  it("es vacío si no hay vista guardada", () => {
    expect(viewKey(undefined)).toBe("");
    expect(viewSignature({ elements: [] })).toBe("");
  });

  it("cambia con el desplazamiento o el zoom", () => {
    expect(viewKey(view)).not.toBe(viewKey({ ...view, zoom: { value: 2 } }));
    expect(viewKey(view)).not.toBe(viewKey({ ...view, scrollX: 400 }));
  });
});
