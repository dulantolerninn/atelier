import { ReactNode } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

export function LoadingState() {
  return <div role="status" aria-label="Cargando" className="grid min-h-[40vh] place-items-center"><LoaderCircle className="animate-spin text-muted" /></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-[40vh] place-items-center text-center">
      <div>
        <TriangleAlert className="mx-auto mb-3 text-muted" size={30} />
        <p className="font-medium">No se pudo cargar</p>
        <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
        {onRetry && <button onClick={onRetry} className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:opacity-90">Reintentar</button>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-[40vh] place-items-center rounded-2xl border border-dashed border-line p-8 text-center">
      <div>
        <div className="mx-auto mb-3 grid place-items-center text-muted">{icon}</div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
