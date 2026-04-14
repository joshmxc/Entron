import { Router } from "express";
import { z } from "zod";
import { authenticate, requireStaff, requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { uploadExcel } from "../middleware/upload";
import * as ctrl from "../controllers/guests.controller";

const router = Router({ mergeParams: true });
router.use(authenticate, requireStaff);

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  guestType: z.enum(["SINGLE", "DOUBLE", "FAMILY", "VIP"]).default("SINGLE"),
  maxAdmissions: z.number().int().min(1).optional(),
  tableNumber: z.string().optional(),
  seatNumber: z.string().optional(),
  notes: z.string().optional(),
});

router.get("/", ctrl.list);
router.post("/", validateBody(createSchema), ctrl.create);
router.post("/import", uploadExcel.single("file"), ctrl.importExcel);
router.get("/:id", ctrl.get);
router.patch("/:id", ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);
router.post("/:id/regenerate-qr", ctrl.regenerateQR);

export default router;
