export type Project = { id: string; name: string; created_at: string; updated_at: string; boardCount: number };

export type BoardSummary = { id: string; project_id: string; title: string; created_at: string; updated_at: string };

export type ViewState = { scrollX: number; scrollY: number; zoom: { value: number } };

export type Scene = {
  elements?: readonly unknown[];
  appState?: Partial<ViewState>;
  files?: Record<string, unknown>;
};

export type Board = BoardSummary & { scene: Scene | null };
