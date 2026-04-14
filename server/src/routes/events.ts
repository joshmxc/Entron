import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin, requireStaff } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { uploadBanner } from "../middleware/upload";
import * as ctrl from "../controllers/events.controller";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1),
  nameSwahili: z.string().optional(),
  description: z.string().optional(),
  venue: z.string().min(1),
  venueSwahili: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

router.get("/", requireStaff, ctrl.list);
router.get("/:id", requireStaff, ctrl.get);
router.get("/:id/stats", requireStaff, ctrl.stats);
router.post("/", requireAdmin, uploadBanner.single("banner"), validateBody(createSchema), ctrl.create);
router.patch("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);

export default router;
