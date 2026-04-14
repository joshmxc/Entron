import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing token" });
    return;
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  if (req.user.role !== "ADMIN") {
    res.status(403).json({ success: false, error: "Admin access required" });
    return;
  }
  next();
}

export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  next();
}
