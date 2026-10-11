import { createClient } from "@/lib/supabase/client";
import type { Board, BoardSummary, Project, Scene } from "@/lib/types";

type Db = ReturnType<typeof createClient>;
type ProjectRow = Omit<Project, "boardCount"> & { boards?: { count: number }[] };

const BOARD_SUMMARY = "id,project_id,title,created_at,updated_at";
const PROJECT_WITH_COUNT = "id,name,created_at,updated_at,boards(count)";

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function toProject({ boards, ...project }: ProjectRow): Project {
  return { ...project, boardCount: boards?.[0]?.count ?? 0 };
}

export async function listProjects(db: Db): Promise<Project[]> {
  const { data, error } = await db.from("projects").select(PROJECT_WITH_COUNT).order("updated_at", { ascending: false });
  check(error);
  return ((data ?? []) as unknown as ProjectRow[]).map(toProject);
}

export async function getProject(db: Db, id: string): Promise<Project | null> {
  const { data, error } = await db.from("projects").select(PROJECT_WITH_COUNT).eq("id", id).maybeSingle();
  check(error);
  return data ? toProject(data as unknown as ProjectRow) : null;
}

export async function createProject(db: Db, name: string): Promise<Project> {
  const { data, error } = await db.from("projects").insert({ name }).select("id,name,created_at,updated_at").single();
  check(error);
  return { ...(data as Omit<Project, "boardCount">), boardCount: 0 };
}

export async function renameProject(db: Db, id: string, name: string) {
  const { error } = await db.from("projects").update({ name }).eq("id", id);
  check(error);
}

export async function deleteProject(db: Db, id: string) {
  const { error } = await db.from("projects").delete().eq("id", id);
  check(error);
}

/** Solo metadatos: el contenido de cada pizarra se carga al abrirla. */
export async function listBoards(db: Db, projectId: string): Promise<BoardSummary[]> {
  const { data, error } = await db.from("boards").select(BOARD_SUMMARY).eq("project_id", projectId).order("updated_at", { ascending: false });
  check(error);
  return (data ?? []) as BoardSummary[];
}

export async function getBoard(db: Db, id: string): Promise<Board | null> {
  const { data, error } = await db.from("boards").select(`${BOARD_SUMMARY},scene`).eq("id", id).maybeSingle();
  check(error);
  return (data as Board | null) ?? null;
}

export async function createBoard(db: Db, projectId: string, title: string, scene?: Scene | null): Promise<BoardSummary> {
  const { data, error } = await db.from("boards").insert({ project_id: projectId, title, ...(scene ? { scene } : {}) }).select(BOARD_SUMMARY).single();
  check(error);
  return data as BoardSummary;
}

export async function renameBoard(db: Db, id: string, title: string) {
  const { error } = await db.from("boards").update({ title }).eq("id", id);
  check(error);
}

export async function duplicateBoard(db: Db, id: string): Promise<BoardSummary> {
  const source = await getBoard(db, id);
  if (!source) throw new Error("La pizarra ya no existe.");
  return createBoard(db, source.project_id, `${source.title} (copia)`.slice(0, 120), source.scene);
}

export async function deleteBoard(db: Db, id: string) {
  const { error } = await db.from("boards").delete().eq("id", id);
  check(error);
}

export type SaveResult = { conflict: true } | { conflict: false; updatedAt: string };

/** Guarda solo si nadie más modificó la pizarra desde `expectedUpdatedAt`; con `force` sobrescribe. */
export async function saveScene(db: Db, id: string, scene: Scene, expectedUpdatedAt: string | null, force = false): Promise<SaveResult> {
  let query = db.from("boards").update({ scene }).eq("id", id);
  if (!force && expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select("updated_at");
  check(error);
  if (!data?.length) return { conflict: true };
  return { conflict: false, updatedAt: (data[0] as { updated_at: string }).updated_at };
}

export async function touchProject(db: Db, id: string) {
  await db.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
}
