"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";

type Session = "loading" | "out" | "in";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setSession(user ? "in" : "out"));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setSession("in");
      if (event === "SIGNED_OUT") setSession("out");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === "loading") return <main className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-muted" /></main>;
  if (session === "out") return <SignIn />;
  return <>{children}</>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);
    const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setSending(false);
    if (signInError) setError("Correo o contraseña incorrectos.");
  }

  const field = "w-full rounded-xl border border-line bg-app py-3 pl-11 pr-4 text-fg outline-none transition focus:border-muted focus:ring-4 focus:ring-subtle";

  return (
    <main className="grid min-h-screen place-items-center bg-app p-6 text-fg">
      <section className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-xl shadow-black/5 sm:p-10">
        <div className="mb-8"><Logo size={48} /></div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.09em] text-muted">{APP_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-[0.025em]">{APP_TAGLINE}</h1>
        <p className="mt-3 leading-6 text-muted">Un espacio privado en la nube para tus proyectos y herramientas.</p>
        <form className="mt-8 space-y-4" onSubmit={signIn}>
          <label className="block text-sm font-medium" htmlFor="email">Correo</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className={field} required />
          </div>
          <label className="block pt-1 text-sm font-medium" htmlFor="password">Contraseña</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} required />
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-fg transition hover:opacity-90 disabled:opacity-60">
            {sending ? <LoaderCircle className="animate-spin" size={18} /> : <>Entrar a {APP_NAME} <ArrowRight size={18} /></>}
          </button>
        </form>
      </section>
    </main>
  );
}
