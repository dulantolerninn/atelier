"use client";

import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export type Crumb = { label: string; href?: string };

export function AppHeader({ crumbs = [] }: { crumbs?: Crumb[] }) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-5">
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-[0.02em]"><Logo size={28} /><span className={crumbs.length ? "hidden sm:inline" : ""}>{APP_NAME}</span></Link>
        {crumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight size={15} className="shrink-0 text-muted" aria-hidden="true" />
            {crumb.href ? <Link href={crumb.href} className="truncate text-muted hover:text-fg">{crumb.label}</Link> : <span className="truncate font-medium" aria-current="page">{crumb.label}</span>}
          </span>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <button type="button" onClick={() => void createClient().auth.signOut()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-fg" aria-label="Cerrar sesión"><LogOut size={16} /><span className="hidden sm:inline">Salir</span></button>
      </div>
    </header>
  );
}
