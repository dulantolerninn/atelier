"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = { key: string; data?: T; error?: string };

/** Carga datos asíncronos asociados a una clave; al cambiar la clave vuelve a cargar. */
export function useResource<T>(key: string, loader: () => Promise<T>) {
  const loaderRef = useRef(loader);
  const [state, setState] = useState<State<T>>({ key: "" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => { loaderRef.current = loader; });

  useEffect(() => {
    let alive = true;
    loaderRef.current()
      .then((data) => { if (alive) setState({ key, data }); })
      .catch((error: unknown) => { if (alive) setState({ key, error: error instanceof Error ? error.message : "No se pudo cargar." }); });
    return () => { alive = false; };
  }, [key, nonce]);

  const current = state.key === key ? state : null;
  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const mutate = useCallback((update: (data: T) => T) => setState((previous) => previous.data === undefined ? previous : { ...previous, data: update(previous.data) }), []);

  return { data: current?.data, error: current?.error, loading: !current, reload, mutate };
}
