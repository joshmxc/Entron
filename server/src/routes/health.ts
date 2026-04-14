import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: "ok", db: "connected", uptime: process.uptime() });
  } catch {
    res.status(503).json({ success: false, status: "error", db: "disconnected" });
  }
});

export default router;
