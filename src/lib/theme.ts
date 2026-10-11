"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const KEY = "atelier-theme";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* sin almacenamiento disponible */ }
  listeners.forEach((listener) => listener());
}

/** El tema inicial lo fija un script en <head> (ver layout) para evitar el parpadeo. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  return { theme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

export const themeInitScript = `try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
