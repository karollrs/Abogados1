import "dotenv/config";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStoreFactory from "memorystore";

import { storage } from "./storage";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: "agent" | "admin" | "abogado";
};

type AuthRequest = Request & {
  user?: any;
  isAuthenticated?: () => boolean;
  logIn?: (user: any, cb: (err?: any) => void) => void;
  logout?: (cb: (err?: any) => void) => void;
  session?: any;
};

function toSafeUser(u: any): SafeUser {
  const role = String(u?.role ?? "")
    .toLowerCase()
    .trim();

  return {
    id: String(u.id),
    email: String(u.email),
    name: String(u.name),
    role:
      role === "admin" || role === "abogado"
        ? (role as "admin" | "abogado")
        : "agent",
  };
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-me";
  const MemoryStore = MemoryStoreFactory(session);
  const isProduction = process.env.NODE_ENV === "production";
  const cookieSameSite: "lax" | "none" = isProduction ? "none" : "lax";

app.set("trust proxy", 1);

app.use(
  session({
    store: new MemoryStore({ checkPeriod: 1000 * 60 * 60 * 24 }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: cookieSameSite,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

  app.use(passport.initialize());
  app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email: string, password: string, done: any) => {
      try {
        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await storage.getUserByEmail(normalizedEmail);

        if (!user) return done(null, false, { message: "Credenciales inválidas" });
        if ((user as any).isActive === 0) return done(null, false, { message: "Usuario deshabilitado" });

        const hash = String((user as any).passwordHash || "");
        const ok = await bcrypt.compare(password, hash);
        if (!ok) return done(null, false, { message: "Credenciales inválidas" });

        return done(null, user);
      } catch (err) {
        return done(err as any);
      }
    }
  )
);

passport.serializeUser((user: any, done: any) => done(null, String(user?.id)));

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await storage.getUserById(String(id));
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err as any);
  }
});



  app.get("/api/auth/me", (req: Request, res: Response) => {
    const r = req as AuthRequest;
    if (!r.isAuthenticated?.() || !r.user) return res.status(401).json({ message: "Unauthorized" });
    return res.json(toSafeUser(r.user));
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Unauthorized" });

      const r = req as AuthRequest;
      r.logIn?.(user, (err2?: any) => {
        if (err2) return next(err2);
        return res.json({ user: toSafeUser(user) });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const r = req as AuthRequest;
    r.logout?.(() => {
      r.session?.destroy?.(() => {
        res.clearCookie("connect.sid");
        return res.json({ success: true });
      });
    });
  });

  app.post("/api/auth/bootstrap", async (req: Request, res: Response) => {
    const existing = await storage.listUsers();
    if (existing.length > 0) return res.status(400).json({ message: "Bootstrap disabled: users already exist" });

    const email = String((req.body as any)?.email || "").toLowerCase().trim();
    const name = String((req.body as any)?.name || "").trim();
    const password = String((req.body as any)?.password || "");

    if (!email || !name || password.length < 8) {
      return res.status(400).json({ message: "email, name y password (>=8) son obligatorios" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ email, name, role: "admin", passwordHash });
    return res.status(201).json({ user: toSafeUser(user) });
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const r = req as AuthRequest;
  if (r.isAuthenticated?.() && r.user) return next();
  return res.status(401).json({ message: "Unauthorized" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const r = req as AuthRequest;
  if (!r.isAuthenticated?.() || !r.user) return res.status(401).json({ message: "Unauthorized" });

  const role = String((r.user as any)?.role || "agent")
    .toLowerCase()
    .trim();
  if (role !== "admin") return res.status(403).json({ message: "Forbidden" });

  return next();
}
