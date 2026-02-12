import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useUser } from "@/hooks/use-auth";

export default function Login() {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = useUser();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isLoading && user) {
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresa con tu usuario del CRM
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            login.mutate(
              { email, password },
              {
                onSuccess: () => navigate("/"),
              }
            );
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="nombre@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
              required
            />
          </div>

          {login.isError ? (
            <p className="text-sm text-destructive">
              {(login.error as any)?.message || "No se pudo iniciar sesión"}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {login.isPending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Si es tu primera vez, un admin debe crear tu usuario.
        </p>
      </div>
    </div>
  );
}
