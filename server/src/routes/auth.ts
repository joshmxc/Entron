import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

const loginSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(6),
});

router.post("/login", authLimiter, validateBody(loginSchema), ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", authenticate, ctrl.me);

export default router;
