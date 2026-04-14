import { Router } from "express";
import { authenticate, requireAdmin, requireStaff } from "../middleware/auth";
import * as ctrl from "../controllers/dashboard.controller";

const router = Router();
router.use(authenticate);

router.get("/admin", requireAdmin, ctrl.adminStats);
router.get("/staff", requireStaff, ctrl.staffDashboard);

export default router;
