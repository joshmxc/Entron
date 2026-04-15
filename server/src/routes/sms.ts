/**
 * Standalone SMS Routes — Next SMS
 * Mounted at: /api/v1/sms
 *
 * GET  /sms/status   — check if Next SMS credentials are configured
 * GET  /sms/balance  — fetch credit balance from Next SMS
 * POST /sms/send     — send one SMS (phone + message)
 * POST /sms/bulk     — send to many recipients
 * POST /sms/test     — admin test: fixed message to verify credentials
 *
 * All routes require authentication and admin role.
 */

import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import * as ctrl from "../controllers/sms.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/status",  ctrl.getStatus);
router.get("/balance", ctrl.getBalance);
router.post("/send",   ctrl.sendSingle);
router.post("/bulk",   ctrl.sendBulk);
router.post("/test",   ctrl.testSMS);

export default router;
