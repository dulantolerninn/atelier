export type RecentBoard = { projectId: string; boardId: string; title: string; projectName: string };

const KEY = "atelier-recent-board";

export function getRecentBoard(): RecentBoard | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}

export function setRecentBoard(recent: RecentBoard) {
  try { localStorage.setItem(KEY, JSON.stringify(recent)); } catch { /* sin almacenamiento disponible */ }
}

export function clearRecentBoard(boardId: string) {
  if (getRecentBoard()?.boardId !== boardId) return;
  try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento disponible */ }
}
