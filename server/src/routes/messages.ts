import { Router } from "express";
import { authenticate, requireStaff } from "../middleware/auth";
import * as ctrl from "../controllers/messages.controller";

const router = Router({ mergeParams: true });
router.use(authenticate, requireStaff);

router.get("/", ctrl.listMessages);
router.get("/guests", ctrl.getGuests);
router.get("/balance", ctrl.getSMSBalance);
router.post("/send", ctrl.sendMessages);

export default router;
