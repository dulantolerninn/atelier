"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";
import { createProject, deleteProject, listProjects, renameProject } from "@/lib/data";
import { filterByName, sortItems, type SortMode } from "@/lib/collection";
import { relativeTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";
import { useResource } from "@/lib/use-resource";
import { AppHeader } from "@/components/app-header";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog, PromptDialog } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { toast, toastError } from "@/components/ui/toast";

type Dialog = { kind: "new" } | { kind: "rename"; project: Project } | { kind: "delete"; project: Project } | null;

export default function ProjectsPage() {
  const db = createClient();
  const router = useRouter();
  const { data: projects, error, loading, reload, mutate } = useResource("projects", () => listProjects(db));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [dialog, setDialog] = useState<Dialog>(null);

  const visible = projects ? sortItems(filterByName(projects, query), sort) : [];

  async function create(name: string) {
    try {
      const project = await createProject(db, name);
      router.push(`/pizarras/${project.id}`);
    } catch (failure) { toastError(failure, "No se pudo crear el proyecto."); }
  }

  async function rename(project: Project, name: string) {
    try {
      await renameProject(db, project.id, name);
      mutate((items) => items.map((item) => item.id === project.id ? { ...item, name } : item));
      setDialog(null);
    } catch (failure) { toastError(failure, "No se pudo renombrar el proyecto."); }
  }

  async function remove(project: Project) {
    try {
      await deleteProject(db, project.id);
      mutate((items) => items.filter((item) => item.id !== project.id));
      setDialog(null);
      toast(`Proyecto “${project.name}” eliminado.`);
    } catch (failure) { toastError(failure, "No se pudo eliminar el proyecto."); }
  }

  const newButton = <button onClick={() => setDialog({ kind: "new" })} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-fg shadow-lg shadow-black/10 hover:opacity-90"><Plus size={17} /> Nuevo proyecto</button>;

  return (
    <main className="min-h-screen bg-app text-fg">
      <AppHeader crumbs={[{ label: "Pizarras" }]} />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.09em] text-muted">Espacio personal</p>
            <h1 className="text-3xl font-semibold tracking-[0.025em]">Tus proyectos</h1>
            <p className="mt-2 text-muted">Organiza cada línea de pensamiento en su propio lugar.</p>
          </div>
          {newButton}
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : !projects?.length ? (
          <EmptyState icon={<FilePlus2 size={32} />} title="Crea tu primer proyecto" text="Cada proyecto agrupa varias pizarras sobre un mismo tema." action={newButton} />
        ) : (
          <>
            <ListToolbar query={query} onQuery={setQuery} sort={sort} onSort={setSort} placeholder="Buscar proyectos" />
            {!visible.length ? <p className="py-12 text-center text-muted">Ningún proyecto coincide con “{query}”.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((project) => (
                  <article key={project.id} className="relative min-h-44 rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-muted hover:shadow-md">
                    <Link href={`/pizarras/${project.id}`} className="block rounded-2xl p-5 pb-16">
                      <span className="mb-6 grid size-10 place-items-center rounded-xl bg-subtle text-muted"><FolderKanban size={20} /></span>
                      <h2 className="truncate font-semibold tracking-[0.02em]">{project.name}</h2>
                      <p className="mt-1 text-sm text-muted">{project.boardCount === 1 ? "1 pizarra" : `${project.boardCount} pizarras`} · {relativeTime(project.updated_at)}</p>
                    </Link>
                    <div className="absolute inset-x-3 bottom-3 flex justify-end gap-0.5 border-t border-line pt-2">
                      <IconButton label={`Renombrar ${project.name}`} onClick={() => setDialog({ kind: "rename", project })}><Pencil size={15} /></IconButton>
                      <IconButton label={`Eliminar ${project.name}`} danger onClick={() => setDialog({ kind: "delete", project })}><Trash2 size={15} /></IconButton>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {dialog?.kind === "new" && <PromptDialog title="Nuevo proyecto" description="Ponle un nombre que te ayude a encontrarlo." placeholder="Ej. Tesis doctoral" submitLabel="Crear" onSubmit={create} onClose={() => setDialog(null)} />}
      {dialog?.kind === "rename" && <PromptDialog title="Renombrar proyecto" initial={dialog.project.name} submitLabel="Guardar" onSubmit={(name) => rename(dialog.project, name)} onClose={() => setDialog(null)} />}
      {dialog?.kind === "delete" && <ConfirmDialog title={`Eliminar “${dialog.project.name}”`} description="Se eliminarán también todas sus pizarras. Esta acción no se puede deshacer." confirmLabel="Eliminar proyecto" onConfirm={() => remove(dialog.project)} onClose={() => setDialog(null)} />}
    </main>
  );
}
