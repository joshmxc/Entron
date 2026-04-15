/**
 * Beem SMS Routes
 * Mounted at: /api/v1/sms
 *
 * POST /api/v1/sms/send   — send to one recipient
 * POST /api/v1/sms/bulk   — send to many recipients
 * POST /api/v1/sms/test   — admin test (fixed message, verify credentials)
 * GET  /api/v1/sms/status — check if Beem is configured
 */

import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import * as ctrl from "../controllers/sms.controller";

const router = Router();

// All SMS routes require a logged-in admin
router.use(authenticate, requireAdmin);

router.get("/status", ctrl.getStatus);
router.post("/send",   ctrl.sendSingle);
router.post("/bulk",   ctrl.sendBulk);
router.post("/test",   ctrl.testSMS);

export default router;
