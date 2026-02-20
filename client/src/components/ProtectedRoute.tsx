import { Route, Redirect } from "wouter";
import { useUser } from "@/hooks/use-auth";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
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

        return <Component />;
      }}
    </Route>
  );
}
