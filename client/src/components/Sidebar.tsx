import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users as UsersIcon,
  Phone,
  Gavel,
  LogOut,
  UserCog,
} from "lucide-react";
import { useLogout, useUser } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

const adminAgentNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Call Logs", href: "/calls", icon: Phone },
  { name: "Attorneys", href: "/attorneys", icon: Gavel },
  { name: "Leads", href: "/leads", icon: UsersIcon },
  { name: "New Lead / Manual", href: "/leads/new-manual", icon: UsersIcon },
];

const abogadoNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mis casos", href: "/attorney-call", icon: Phone },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const logout = useLogout();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      navigate("/login");
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  };

  // ✅ Solo admins ven "Usuarios"
  const baseNavigation =
    user?.role === "abogado" ? abogadoNavigation : adminAgentNavigation;

  const navigation = [
    ...baseNavigation,
    ...(user?.role === "admin"
      ? [{ name: "Usuarios", href: "/users", icon: UserCog }]
      : []),
  ];

  return (
    <div className="hidden md:flex h-screen w-64 flex-col fixed inset-y-0 z-50 bg-card border-r border-border shadow-sm">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold font-display">
          TG
        </div>
        <span className="text-lg font-bold font-display text-foreground tracking-tight">
          TUS ABOGADOS
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground mb-4 px-2 uppercase tracking-wider">
          Menu
        </div>

        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                  ${isActive
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <item.icon
                  className={`h-5 w-5 transition-colors ${isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                    }`}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User / Footer */}
      <div className="p-4 border-t border-border/50">
        {user ? (
          <div className="mb-3 rounded-xl border border-border bg-background px-3 py-2">
            <div className="text-sm font-medium leading-tight truncate">
              {user.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user.email}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Rol: {user.role}
            </div>
          </div>
        ) : null}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
