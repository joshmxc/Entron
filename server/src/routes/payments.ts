import { Router } from "express";
import { z } from "zod";
import { authenticate, requireStaff } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "../controllers/payments.controller";

const router = Router();

// Callbacks are public (webhook from payment providers)
router.post("/mpesa/callback", ctrl.mpesaCallback);
router.post("/airtel/callback", ctrl.airtelCallback);

router.use(authenticate, requireStaff);

const initiateSchema = z.object({
  eventId: z.string().uuid(),
  guestId: z.string().uuid().optional(),
  phone: z.string().min(9),
  amount: z.number().positive(),
  provider: z.enum(["MPESA", "AIRTEL", "TIGO_PESA", "CASH"]),
  description: z.string().optional(),
});

router.post("/initiate", validateBody(initiateSchema), ctrl.initiate);
router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);

export default router;
