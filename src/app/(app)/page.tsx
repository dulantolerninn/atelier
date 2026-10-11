"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Plus } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { getRecentBoard } from "@/lib/recent";
import { tools } from "@/lib/tools";
import { AppHeader } from "@/components/app-header";

export default function Home() {
  const [recent] = useState(getRecentBoard);

  return (
    <main className="min-h-screen bg-app text-fg">
      <AppHeader />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.09em] text-muted">{APP_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-[0.025em]">{APP_TAGLINE}</h1>

        {recent && (
          <Link href={`/pizarras/${recent.projectId}/${recent.boardId}`} className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-muted">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-muted"><Clock size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs text-muted">Continuar donde lo dejaste</span><span className="block truncate font-medium">{recent.title} <span className="font-normal text-muted">· {recent.projectName}</span></span></span>
            <ArrowRight size={18} className="shrink-0 text-muted" />
          </Link>
        )}

        <h2 className="mb-4 mt-10 text-sm font-semibold uppercase tracking-[0.09em] text-muted">Herramientas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.id} href={tool.href} className="group min-h-40 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-muted hover:shadow-md">
              <span className="mb-8 grid size-10 place-items-center rounded-xl bg-subtle text-muted"><tool.icon size={20} /></span>
              <h3 className="font-semibold tracking-[0.02em]">{tool.name}</h3>
              <p className="mt-1 text-sm text-muted">{tool.description}</p>
            </Link>
          ))}
          <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-line p-5 text-center text-muted">
            <span><Plus className="mx-auto mb-2" size={20} /><span className="text-sm">Más herramientas próximamente</span></span>
          </div>
        </div>
      </section>
    </main>
  );
}
