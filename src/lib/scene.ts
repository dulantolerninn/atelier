import type { Scene, ViewState } from "./types";

type SceneElement = { id: string; version?: number; isDeleted?: boolean; fileId?: string | null };

/** Escena que se guarda: sin elementos borrados, sin imágenes huérfanas y con la vista (desplazamiento y zoom). */
export function buildScene(elements: readonly unknown[], view: ViewState, files: Record<string, unknown> = {}): Scene {
  const live = (elements as SceneElement[]).filter((element) => !element.isDeleted);
  const used = new Set(live.map((element) => element.fileId).filter((id): id is string => Boolean(id)));
  const keptFiles = Object.fromEntries(Object.entries(files).filter(([id]) => used.has(id)));
  return { elements: live, appState: { scrollX: view.scrollX, scrollY: view.scrollY, zoom: { value: view.zoom.value } }, files: keptFiles };
}

/** Cambia solo cuando cambia el dibujo (elementos o imágenes), no la vista. */
export function contentSignature(scene: Scene | null | undefined): string {
  const elements = ((scene?.elements ?? []) as SceneElement[]).filter((element) => !element.isDeleted);
  return `${elements.map((element) => `${element.id}:${element.version}`).join("|")}#${Object.keys(scene?.files ?? {}).sort().join(",")}`;
}

/** Cambia solo cuando se mueve o se hace zoom en la pizarra. Vacío si la escena no guarda vista. */
export function viewKey(view: Partial<ViewState> | null | undefined): string {
  if (!view) return "";
  return `${Math.round(view.scrollX ?? 0)}:${Math.round(view.scrollY ?? 0)}:${(view.zoom?.value ?? 1).toFixed(2)}`;
}

export const viewSignature = (scene: Scene | null | undefined) => viewKey(scene?.appState);
