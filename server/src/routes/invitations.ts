import { Router } from "express";
import { authenticate, requireAdmin, requireStaff } from "../middleware/auth";
import { uploadTemplate } from "../middleware/upload";
import * as ctrl from "../controllers/invitations.controller";

const router = Router({ mergeParams: true });

// Webhook has no auth
router.post("/webhook", ctrl.handleWebhook);

router.use(authenticate, requireStaff);

router.get("/", ctrl.listInvitations);
router.get("/templates", ctrl.listTemplates);
router.post("/templates", requireAdmin, uploadTemplate.single("file"), ctrl.uploadTemplate);
router.patch("/templates/:templateId", requireAdmin, ctrl.updateTemplate);
router.delete("/templates/:templateId", requireAdmin, ctrl.deleteTemplate);
router.post("/generate", requireAdmin, ctrl.generateCards);
router.get("/download-zip", ctrl.downloadZip);

export default router;
