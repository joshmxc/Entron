import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as authService from "../services/auth.service";

const router = Router();
router.use(authenticate, requireAdmin);

const createSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  password: z.string().min(6).optional(),
});

router.get("/", async (_req, res) => {
  const data = await authService.listUsers();
  res.json({ success: true, data });
});

router.post("/", validateBody(createSchema), async (req, res) => {
  const data = await authService.createUser(req.body);
  res.status(201).json({ success: true, data });
});

router.patch("/:id", validateBody(updateSchema), async (req, res) => {
  const data = await authService.updateUser(req.params.id, req.body);
  res.json({ success: true, data });
});

router.delete("/:id", async (req, res) => {
  await authService.deleteUser(req.params.id);
  res.json({ success: true, message: "User deleted" });
});

export default router;
