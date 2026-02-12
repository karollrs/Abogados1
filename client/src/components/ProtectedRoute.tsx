import { Route, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { data: user, isLoading } = useUser();
  const [, navigate] = useLocation();

  return (
    <Route
      path={path}
      component={() => {
        if (isLoading) {
          return (
            <div className="min-h-screen md:pl-64 p-6 text-sm text-muted-foreground">
              Cargando sesión…
            </div>
          );
        }

        if (!user) {
          navigate("/login");
          return null;
        }

        return <Component />;
      }}
    />
  );
}
