import { Route, Redirect } from "wouter";
import { useUser } from "@/hooks/use-auth";

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles?: Array<"admin" | "agent" | "abogado">;
}) {
  const { data: user, isLoading } = useUser();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="min-h-screen md:pl-64 p-6 text-sm text-muted-foreground">
              Cargando sesión…
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/login" />;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          if (user.role === "abogado") return <Redirect to="/" />;
          return <Redirect to="/" />;
        }

        return <Component />;
      }}
    </Route>
  );
}
