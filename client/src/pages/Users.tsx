import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { UserCog, Shield, User, CheckCircle2, XCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

type Row = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
  isActive: number;
  createdAt?: number;
  updatedAt?: number;
};

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "muted";
}) {
  const cls =
    variant === "success"
      ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
      : variant === "danger"
      ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
      : variant === "muted"
      ? "bg-muted text-muted-foreground ring-1 ring-border"
      : "bg-primary/10 text-primary ring-1 ring-primary/20";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</label>;
}

export default function UsersPage() {
  const { data: me, isLoading: meLoading } = useUser();
  const [, navigate] = useLocation();

  // ✅ Evita redirect en render (bug clásico). Hazlo solo cuando ya cargó.
  if (!meLoading && me && me.role !== "admin") {
    navigate("/");
  }

  const { data: rows, isLoading, error } = useQuery<Row[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }) as any,
    enabled: !meLoading && !!me && me.role === "admin",
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "agent">("agent");
  const [password, setPassword] = useState("");

  const canCreate = useMemo(() => {
    return email.trim().length > 3 && name.trim().length > 1 && password.length >= 8;
  }, [email, name, password]);

  const createUser = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/users", { email, name, role, password });
      return true;
    },
    onSuccess: () => {
      setEmail("");
      setName("");
      setRole("agent");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const setActive = useMutation({
    mutationFn: async (p: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/users/${p.id}/active`, { isActive: p.isActive });
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users"] }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ✅ Menu como Dashboard */}
      <Sidebar />

      {/* ✅ Contenido como Dashboard */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 animate-in">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Usuarios</h1>
              <p className="text-sm text-muted-foreground">Crea cuentas, asigna roles y activa/desactiva accesos.</p>
            </div>
          </div>

          {me ? (
            <div className="flex items-center gap-2">
              <Badge variant="muted">
                Sesión: <span className="font-semibold">{me.email}</span>
              </Badge>
              <Badge variant={me.role === "admin" ? "default" : "muted"}>
                {me.role === "admin" ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                {me.role}
              </Badge>
            </div>
          ) : null}
        </header>

        {/* Si aún no cargó sesión */}
        {meLoading ? (
          <div className="text-sm text-muted-foreground">Cargando sesión…</div>
        ) : null}

        {/* Si no es admin */}
        {!meLoading && me && me.role !== "admin" ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No tienes permisos para ver esta sección.
          </div>
        ) : null}

        {/* Admin view */}
        {!meLoading && me && me.role === "admin" ? (
          <div className="space-y-6">
            {/* Crear usuario */}
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="p-5 md:p-6 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Crear usuario</h2>
                  <p className="text-sm text-muted-foreground">Contraseña mínima: 8 caracteres.</p>
                </div>
                <Badge variant="muted">Admin-only</Badge>
              </div>

              <div className="p-5 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FieldLabel>Email</FieldLabel>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="nombre@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel>Nombre</FieldLabel>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Nombre y apellido"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel>Rol</FieldLabel>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                    >
                      <option value="agent">agent</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel>Contraseña</FieldLabel>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                    />
                  </div>
                </div>

                {createUser.isError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {(createUser.error as any)?.message || "No se pudo crear el usuario."}
                  </div>
                ) : null}

                <button
                  onClick={() => createUser.mutate()}
                  disabled={!canCreate || createUser.isPending}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {createUser.isPending ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </div>

            {/* Lista usuarios */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-border/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Lista de usuarios</h2>
                  <p className="text-sm text-muted-foreground">Activa/desactiva accesos sin borrar registros.</p>
                </div>
                <Badge variant="muted">{rows?.length ?? 0} usuarios</Badge>
              </div>

              {isLoading ? <div className="p-6 text-sm text-muted-foreground">Cargando...</div> : null}
              {error ? <div className="p-6 text-sm text-destructive">{String(error)}</div> : null}

              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left">
                      <th className="px-6 py-3 font-semibold text-muted-foreground">Usuario</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">Rol</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground">Estado</th>
                      <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(rows ?? []).map((u) => {
                      const active = u.isActive === 1;
                      return (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold">{u.name}</div>
                            <div className="text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={u.role === "admin" ? "default" : "muted"}>
                              {u.role === "admin" ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {active ? (
                              <Badge variant="success">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                              </Badge>
                            ) : (
                              <Badge variant="danger">
                                <XCircle className="h-3.5 w-3.5" /> Desactivado
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setActive.mutate({ id: u.id, isActive: !active })}
                              disabled={setActive.isPending}
                              className={`rounded-xl px-3 py-2 text-sm font-semibold border transition-colors
                                ${active ? "border-destructive/30 text-destructive hover:bg-destructive/10" : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"}
                                disabled:opacity-60`}
                            >
                              {active ? "Desactivar" : "Activar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
