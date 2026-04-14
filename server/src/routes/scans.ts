import { Router } from "express";
import { z } from "zod";
import { authenticate, requireStaff } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { scanLimiter } from "../middleware/rateLimiter";
import * as ctrl from "../controllers/scans.controller";

const router = Router();
router.use(authenticate, requireStaff);

const scanSchema = z.object({
  qrCode: z.string().uuid(),
  eventId: z.string().uuid(),
  offlineTimestamp: z.string().datetime().optional(),
});

const batchSchema = z.object({
  items: z.array(scanSchema).max(500),
});

router.post("/", scanLimiter, validateBody(scanSchema), ctrl.scan);
router.post("/batch-sync", validateBody(batchSchema), ctrl.batchSync);
router.get("/", ctrl.list);
router.get("/stats/me", ctrl.staffStats);
router.get("/stats/:staffId", ctrl.staffStats);

export default router;
