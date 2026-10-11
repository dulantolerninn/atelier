"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBoard, getProject, listBoards } from "@/lib/data";
import { setRecentBoard } from "@/lib/recent";
import { createClient } from "@/lib/supabase/client";
import { useResource } from "@/lib/use-resource";
import { BoardCanvas } from "@/components/board-canvas";
import { ErrorState, LoadingState } from "@/components/ui/states";

export default function BoardPage() {
  const { projectId, boardId } = useParams<{ projectId: string; boardId: string }>();
  const db = createClient();
  const { data, error, loading, reload } = useResource(`board:${boardId}`, async () => {
    const [board, siblings, project] = await Promise.all([getBoard(db, boardId), listBoards(db, projectId), getProject(db, projectId)]);
    return { board, siblings, project };
  });

  const board = data?.board;
  const projectName = data?.project?.name;

  useEffect(() => {
    if (board && projectName) setRecentBoard({ projectId, boardId: board.id, title: board.title, projectName });
  }, [board, projectId, projectName]);

  if (loading) return <main className="grid h-dvh place-items-center bg-app"><LoadingState /></main>;
  if (error) return <main className="grid h-dvh place-items-center bg-app"><ErrorState message={error} onRetry={reload} /></main>;
  if (!board || !data) {
    return (
      <main className="grid h-dvh place-items-center bg-app text-center text-fg">
        <div><p className="font-medium">Pizarra no encontrada</p><p className="mt-1 text-sm text-muted">Puede que haya sido eliminada.</p><Link href={`/pizarras/${projectId}`} className="mt-4 inline-block rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:opacity-90">Volver al proyecto</Link></div>
      </main>
    );
  }

  return <BoardCanvas key={board.id} board={board} siblings={data.siblings} projectName={projectName ?? ""} />;
}
