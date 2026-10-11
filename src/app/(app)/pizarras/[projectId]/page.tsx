"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, LayoutDashboard, Pencil, Plus, Trash2 } from "lucide-react";
import { createBoard, deleteBoard, duplicateBoard, getProject, listBoards, renameBoard } from "@/lib/data";
import { filterByName, sortItems, type SortMode } from "@/lib/collection";
import { relativeTime } from "@/lib/format";
import { clearRecentBoard } from "@/lib/recent";
import { createClient } from "@/lib/supabase/client";
import type { BoardSummary } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { AppHeader } from "@/components/app-header";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog, PromptDialog } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { toast, toastError } from "@/components/ui/toast";

type Dialog = { kind: "new" } | { kind: "rename"; board: BoardSummary } | { kind: "delete"; board: BoardSummary } | null;

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const db = createClient();
  const router = useRouter();
  const { data, error, loading, reload, mutate } = useResource(`project:${projectId}`, async () => {
    const [project, boards] = await Promise.all([getProject(db, projectId), listBoards(db, projectId)]);
    return { project, boards };
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [dialog, setDialog] = useState<Dialog>(null);

  const project = data?.project;
  const visible = data ? sortItems(filterByName(data.boards, query), sort) : [];

  async function create(title: string) {
    try {
      const board = await createBoard(db, projectId, title);
      router.push(`/pizarras/${projectId}/${board.id}`);
    } catch (failure) { toastError(failure, "No se pudo crear la pizarra."); }
  }

  async function rename(board: BoardSummary, title: string) {
    try {
      await renameBoard(db, board.id, title);
      mutate((current) => ({ ...current, boards: current.boards.map((item) => item.id === board.id ? { ...item, title } : item) }));
      setDialog(null);
    } catch (failure) { toastError(failure, "No se pudo renombrar la pizarra."); }
  }

  async function duplicate(board: BoardSummary) {
    try {
      const copy = await duplicateBoard(db, board.id);
      mutate((current) => ({ ...current, boards: [copy, ...current.boards] }));
      toast(`Pizarra duplicada como “${copy.title}”.`);
    } catch (failure) { toastError(failure, "No se pudo duplicar la pizarra."); }
  }

  async function remove(board: BoardSummary) {
    try {
      await deleteBoard(db, board.id);
      clearRecentBoard(board.id);
      mutate((current) => ({ ...current, boards: current.boards.filter((item) => item.id !== board.id) }));
      setDialog(null);
      toast(`Pizarra “${board.title}” eliminada.`);
    } catch (failure) { toastError(failure, "No se pudo eliminar la pizarra."); }
  }

  const newButton = <button onClick={() => setDialog({ kind: "new" })} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-fg shadow-lg shadow-black/10 hover:opacity-90"><Plus size={17} /> Nueva pizarra</button>;

  return (
    <main className="min-h-screen bg-app text-fg">
      <AppHeader crumbs={[{ label: "Pizarras", href: "/pizarras" }, { label: project?.name ?? "…" }]} />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : !project ? (
          <EmptyState icon={<LayoutDashboard size={32} />} title="Proyecto no encontrado" text="Puede que haya sido eliminado." action={<Link href="/pizarras" className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-fg hover:opacity-90">Volver a proyectos</Link>} />
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.09em] text-muted">Proyecto</p>
                <h1 className="truncate text-3xl font-semibold tracking-[0.025em]">{project.name}</h1>
                <p className="mt-2 text-muted">{data.boards.length === 1 ? "1 pizarra" : `${data.boards.length} pizarras`}</p>
              </div>
              {newButton}
            </div>

            {!data.boards.length ? (
              <EmptyState icon={<LayoutDashboard size={32} />} title="Crea tu primera pizarra" text="Cada pizarra vive dentro de este proyecto y se guarda automáticamente en la nube." action={newButton} />
            ) : (
              <>
                <ListToolbar query={query} onQuery={setQuery} sort={sort} onSort={setSort} placeholder="Buscar pizarras" />
                {!visible.length ? <p className="py-12 text-center text-muted">Ninguna pizarra coincide con “{query}”.</p> : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((board) => (
                      <article key={board.id} className="relative min-h-40 rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-muted hover:shadow-md">
                        <Link href={`/pizarras/${projectId}/${board.id}`} className="block rounded-2xl p-5 pb-16">
                          <span className="mb-6 grid size-10 place-items-center rounded-xl bg-subtle text-muted"><LayoutDashboard size={19} /></span>
                          <h2 className="truncate font-semibold tracking-[0.02em]">{board.title}</h2>
                          <p className="mt-1 text-sm text-muted">Editada {relativeTime(board.updated_at)}</p>
                        </Link>
                        <div className="absolute inset-x-3 bottom-3 flex justify-end gap-0.5 border-t border-line pt-2">
                          <IconButton label={`Renombrar ${board.title}`} onClick={() => setDialog({ kind: "rename", board })}><Pencil size={15} /></IconButton>
                          <IconButton label={`Duplicar ${board.title}`} onClick={() => void duplicate(board)}><Copy size={15} /></IconButton>
                          <IconButton label={`Eliminar ${board.title}`} danger onClick={() => setDialog({ kind: "delete", board })}><Trash2 size={15} /></IconButton>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {dialog?.kind === "new" && <PromptDialog title="Nueva pizarra" description="Ponle un nombre que te ayude a encontrarla." placeholder="Ej. Mapa de conceptos" submitLabel="Crear" onSubmit={create} onClose={() => setDialog(null)} />}
      {dialog?.kind === "rename" && <PromptDialog title="Renombrar pizarra" initial={dialog.board.title} submitLabel="Guardar" onSubmit={(title) => rename(dialog.board, title)} onClose={() => setDialog(null)} />}
      {dialog?.kind === "delete" && <ConfirmDialog title={`Eliminar “${dialog.board.title}”`} description="Se perderá todo su contenido. Esta acción no se puede deshacer." confirmLabel="Eliminar pizarra" onConfirm={() => remove(dialog.board)} onClose={() => setDialog(null)} />}
    </main>
  );
}
