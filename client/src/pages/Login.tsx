import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { useLogin } from "@/hooks/use-auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || login.isPending) return;

    setError(null);
    setLoading(true);

    try {
      const form = e.currentTarget as HTMLFormElement;
      const fd = new FormData(form);

      const submittedEmail = String(fd.get("email") ?? "").trim();
      const submittedPassword = String(fd.get("password") ?? "");

      if (!submittedEmail || !submittedPassword) {
        throw new Error("Email y password obligatorios");
      }

      setEmail(submittedEmail);
      setPassword(submittedPassword);

      const data = await login.mutateAsync({
        email: submittedEmail,
        password: submittedPassword,
      });

      navigate(data?.user?.role === "abogado" ? "/attorney-call" : "/");
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50 p-6">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
          <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 text-white p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="h-27 w-44 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <span className="font-bold text-lg">Tus Abogados 24/7</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight">
                Hola,<br />bienvenido.
              </h1>
              <p className="mt-4 text-blue-100 text-sm max-w-sm">
                Accede a tu panel para gestionar leads, llamadas y asignacion de abogados.
              </p>
            </div>
            <div className="absolute bottom-6 text-xs text-blue-100">
              {new Date().getFullYear()} Tus Abogados 24/7
            </div>
          </div>

          <div className="flex items-center justify-center bg-white p-10">
            <div className="w-full max-w-sm">
              <h2 className="text-2xl font-bold text-blue-900">Iniciar sesion</h2>
              <p className="mt-1 text-sm text-blue-600">
                Ingresa tus credenciales para continuar.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="text-xs font-medium text-blue-800">Correo</label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <input
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="username"
                      placeholder="nombre@correo.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-blue-800">Contrasena</label>

                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />

                    <input
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="********"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || login.isPending}
                  className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white py-2.5 text-sm font-semibold shadow-lg shadow-blue-300/40 transition"
                >
                  {loading || login.isPending ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
