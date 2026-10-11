import { LayoutDashboard, type LucideIcon } from "lucide-react";

export type Tool = { id: string; name: string; description: string; href: string; icon: LucideIcon };

/** Registro de herramientas: para añadir una nueva basta con agregarla aquí y crear su ruta. */
export const tools: Tool[] = [
  { id: "pizarras", name: "Pizarras", description: "Pizarras infinitas para mapear ideas, organizadas por proyecto.", href: "/pizarras", icon: LayoutDashboard },
];
