"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, FilePlus2, FolderKanban, LayoutDashboard, LoaderCircle, LogOut, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BoardCanvas } from "@/components/board-canvas";

type Project = { id: string; name: string; created_at: string };
type Board = { id: string; project_id: string; title: string; scene: { elements?: readonly unknown[] } | null; updated_at: string };

export function Workspace() {
  const supabase = useMemo(createClient, []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<"project" | "board" | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { void loadProjects(); }, []);

  async function loadProjects() {
    setLoading(true);
    const { data } = await supabase.from("projects").select("id,name,created_at").order("updated_at", { ascending: false });
    setProjects((data ?? []) as Project[]);
    setLoading(false);
  }

  async function selectProject(nextProject: Project) {
    setProject(nextProject); setBoard(null); setLoading(true);
    const { data } = await supabase.from("boards").select("id,project_id,title,scene,updated_at").eq("project_id", nextProject.id).order("updated_at", { ascending: false });
    setBoards((data ?? []) as Board[]); setLoading(false);
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim(); if (!cleanName || !creating) return;
    if (creating === "project") {
      const { data } = await supabase.from("projects").insert({ name: cleanName }).select("id,name,created_at").single();
      if (data) { const newProject = data as Project; setProjects((items) => [newProject, ...items]); await selectProject(newProject); }
    } else if (project) {
      const { data } = await supabase.from("boards").insert({ project_id: project.id, title: cleanName }).select("id,project_id,title,scene,updated_at").single();
      if (data) { const newBoard = data as Board; setBoards((items) => [newBoard, ...items]); setBoard(newBoard); }
    }
    setName(""); setCreating(null);
  }

  async function renameProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim(); if (!cleanName || !editingProject) return;
    const { data } = await supabase.from("projects").update({ name: cleanName }).eq("id", editingProject.id).select("id,name,created_at").single();
    if (data) {
      const renamed = data as Project;
      setProjects((items) => items.map((item) => item.id === renamed.id ? renamed : item));
      if (project?.id === renamed.id) setProject(renamed);
    }
    setName(""); setEditingProject(null);
  }

  async function removeProject(id: string) {
    const target = projects.find((item) => item.id === id);
    if (!target || !window.confirm(`¿Eliminar “${target.name}”? También se eliminarán todas sus pizarras.`)) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects((items) => items.filter((item) => item.id !== id));
    if (project?.id === id) { setProject(null); setBoard(null); }
  }

  async function removeBoard(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    if (!window.confirm("¿Eliminar esta pizarra? Esta acción no se puede deshacer.")) return;
    await supabase.from("boards").delete().eq("id", id);
    setBoards((items) => items.filter((item) => item.id !== id));
    if (board?.id === id) setBoard(null);
  }

  function startRename(nextProject: Project) { setName(nextProject.name); setEditingProject(nextProject); }

  if (loading && !project) return <main className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-zinc-600" /></main>;

  if (board) return <BoardCanvas key={board.id} board={board} onBack={() => setBoard(null)} onSaved={(id, scene) => setBoards((items) => items.map((item) => item.id === id ? { ...item, scene } : item))} />;

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-800">
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5">
        <div className="flex items-center gap-2"><button onClick={() => { setProject(null); setBoard(null); }} className="flex items-center gap-2 font-semibold tracking-[0.03em]"><span className="grid size-8 place-items-center rounded-lg bg-zinc-700 text-sm text-white">T</span> THETA BOARD</button>{project && <button onClick={() => setSidebarOpen((isOpen) => !isOpen)} aria-label={sidebarOpen ? "Ocultar panel de pizarras" : "Mostrar panel de pizarras"} className="ml-2 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100">{sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}</button>}</div>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"><LogOut size={16} /> Salir</button>
      </header>
      {!project ? <ProjectsView projects={projects} onOpen={selectProject} onNew={() => setCreating("project")} onRename={startRename} onDelete={removeProject} /> : (
        <section className="flex min-h-[calc(100vh-4rem)]">
          {sidebarOpen && <aside className="w-72 shrink-0 border-r border-zinc-200 bg-white p-4">
            <button onClick={() => { setProject(null); setBoard(null); }} className="mb-6 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"><ChevronLeft size={16} /> Proyectos</button>
            <div className="mb-4 flex items-start justify-between gap-3"><h1 className="font-semibold leading-5 tracking-[0.02em]">{project.name}</h1><button onClick={() => setCreating("board")} aria-label="Crear pizarra" className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"><Plus size={19} /></button></div>
            <div className="space-y-1">{boards.map((item) => <button key={item.id} onClick={() => setBoard(item)} className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100"><PanelLeftClose size={15} /><span className="min-w-0 flex-1 truncate">{item.title}</span><span onClick={(event) => removeBoard(event, item.id)} className="hidden rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 group-hover:block"><Trash2 size={14} /></span></button>)}</div>
            {!boards.length && <p className="mt-8 text-center text-sm leading-5 text-zinc-400">Crea tu primera pizarra para empezar a pensar visualmente.</p>}
          </aside>}
          <section className="min-w-0 flex-1"><EmptyBoard onCreate={() => setCreating("board")} /></section>
        </section>
      )}
      {creating && <CreateModal kind={creating} name={name} setName={setName} onClose={() => setCreating(null)} onSubmit={createItem} />}
      {editingProject && <RenameProjectModal name={name} setName={setName} onClose={() => setEditingProject(null)} onSubmit={renameProject} />}
    </main>
  );
}

function ProjectsView({ projects, onOpen, onNew, onRename, onDelete }: { projects: Project[]; onOpen: (project: Project) => void; onNew: () => void; onRename: (project: Project) => void; onDelete: (id: string) => void }) {
  return <section className="mx-auto max-w-6xl px-6 py-12"><div className="mb-9 flex items-end justify-between"><div><p className="mb-2 text-sm font-semibold tracking-[0.09em] text-zinc-500">ESPACIO PERSONAL</p><h1 className="text-3xl font-semibold tracking-[0.025em]">Tus proyectos</h1><p className="mt-2 text-zinc-500">Organiza cada línea de pensamiento en su propio lugar.</p></div><button onClick={onNew} className="flex items-center gap-2 rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-500/20 hover:bg-zinc-800"><Plus size={17} /> Nuevo proyecto</button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((item) => <article key={item.id} className="group min-h-40 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"><button onClick={() => onOpen(item)} className="w-full text-left"><span className="mb-8 grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-600"><FolderKanban size={20} /></span><h2 className="font-semibold tracking-[0.02em]">{item.name}</h2><p className="mt-1 text-sm text-zinc-400">Abrir pizarras <span className="transition group-hover:ml-1">→</span></p></button><div className="mt-4 flex gap-1 border-t border-zinc-100 pt-3"><button onClick={() => onRename(item)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"><Pencil size={13} /> Editar</button><button onClick={() => onDelete(item.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"><Trash2 size={13} /> Eliminar</button></div></article>)}{!projects.length && <button onClick={onNew} className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-zinc-300 p-5 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100/50"><span className="text-center"><FilePlus2 className="mx-auto mb-2 text-zinc-500" /><span className="text-sm font-medium">Crea tu primer proyecto</span></span></button>}</div></section>;
}

function EmptyBoard({ onCreate }: { onCreate: () => void }) { return <div className="grid h-full min-h-[calc(100vh-4rem)] place-items-center p-6"><div className="text-center"><LayoutDashboard className="mx-auto mb-4 text-zinc-500" size={35} /><h2 className="text-xl font-semibold tracking-[0.02em]">Elige o crea una pizarra</h2><p className="mt-2 max-w-sm text-zinc-500">Cada pizarra vive dentro de este proyecto y se guarda automáticamente en la nube.</p><button onClick={onCreate} className="mt-6 rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800">Crear pizarra</button></div></div>; }

function CreateModal({ kind, name, setName, onClose, onSubmit }: { kind: "project" | "board"; name: string; setName: (name: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="fixed inset-0 z-10 grid place-items-center bg-zinc-900/25 p-5"><form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold tracking-[0.02em]">Nuevo {kind === "project" ? "proyecto" : "pizarra"}</h2><p className="mt-1 text-sm text-zinc-500">Ponle un nombre que te ayude a encontrarlo.</p><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={kind === "project" ? "Ej. Tesis doctoral" : "Ej. Mapa de conceptos"} className="mt-5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200" /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Cancelar</button><button className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800">Crear</button></div></form></div>; }

function RenameProjectModal({ name, setName, onClose, onSubmit }: { name: string; setName: (name: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="fixed inset-0 z-10 grid place-items-center bg-zinc-900/25 p-5"><form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold tracking-[0.02em]">Editar proyecto</h2><p className="mt-1 text-sm text-zinc-500">Actualiza el nombre del proyecto.</p><input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200" /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Cancelar</button><button className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800">Guardar</button></div></form></div>; }
