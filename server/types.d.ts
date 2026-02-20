import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      role: "agent" | "admin" | "abogado";
    }
  }
}

export {};
