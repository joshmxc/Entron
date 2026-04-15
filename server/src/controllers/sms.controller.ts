/**
 * SMS Controller — Beem Africa
 * Handles standalone SMS endpoints (test, direct send, balance).
 * Bulk guest messaging still goes through messages.controller.ts.
 */

import { Request, Response } from "express";
import { sendBeemSMS, sendBeemBulkSMS, normalizeTanzaniaPhone, isBeemConfigured } from "../lib/beem";
import { config } from "../config";

// ── POST /api/v1/sms/send ─────────────────────────────────────────────────────
/**
 * Send a single SMS to one recipient.
 * Body: { phone: string, message: string }
 *
 * Use this for OTPs, alerts, and direct one-off notifications.
 */
export async function sendSingle(req: Request, res: Response): Promise<void> {
  const { phone, message } = req.body as { phone?: string; message?: string };

  // Validate inputs
  if (!phone || typeof phone !== "string" || phone.trim() === "") {
    res.status(400).json({ success: false, error: "phone is required" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }
  if (message.length > 1600) {
    res.status(400).json({ success: false, error: "message too long (max 1600 characters)" });
    return;
  }

  const normalized = normalizeTanzaniaPhone(phone.trim());
  if (normalized.length < 10) {
    res.status(400).json({ success: false, error: "invalid phone number format" });
    return;
  }

  try {
    const result = await sendBeemSMS(phone.trim(), message.trim());

    if (result.status === "FAILED") {
      res.status(502).json({
        success: false,
        error: "SMS delivery failed",
        detail: result.error,
        to: result.dest_addr,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        to: result.dest_addr,
        messageId: result.messageId,
        status: result.status,
        simulated: result.status === "SIMULATED",
      },
    });
  } catch (err) {
    console.error("[SMS] Unexpected error in sendSingle:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

// ── POST /api/v1/sms/bulk ─────────────────────────────────────────────────────
/**
 * Send the same message to multiple recipients.
 * Body: { recipients: string[], message: string }
 */
export async function sendBulk(req: Request, res: Response): Promise<void> {
  const { recipients, message } = req.body as { recipients?: string[]; message?: string };

  if (!Array.isArray(recipients) || recipients.length === 0) {
    res.status(400).json({ success: false, error: "recipients must be a non-empty array of phone numbers" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }
  if (recipients.length > 1000) {
    res.status(400).json({ success: false, error: "max 1000 recipients per request" });
    return;
  }

  try {
    const result = await sendBeemBulkSMS(
      recipients.map((p) => ({ to: p })),
      message.trim()
    );

    res.json({
      success: true,
      data: {
        sent: result.sent,
        failed: result.failed,
        total: recipients.length,
        results: result.results,
        simulated: !isBeemConfigured(),
      },
    });
  } catch (err) {
    console.error("[SMS] Unexpected error in sendBulk:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

// ── POST /api/v1/sms/test ─────────────────────────────────────────────────────
/**
 * Admin test endpoint — sends a test SMS to verify Beem credentials.
 * Body: { phone: string }
 * Always sends a fixed test message.
 */
export async function testSMS(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as { phone?: string };

  if (!phone || typeof phone !== "string" || phone.trim() === "") {
    res.status(400).json({ success: false, error: "phone is required" });
    return;
  }

  const normalized = normalizeTanzaniaPhone(phone.trim());
  if (normalized.length < 10) {
    res.status(400).json({ success: false, error: "invalid phone number" });
    return;
  }

  const testMessage =
    `[Entron Test] SMS integration working! ` +
    `Sender: ${config.beem.senderId || "ENTRON"} — ${new Date().toLocaleTimeString("en-GB")}`;

  try {
    const result = await sendBeemSMS(phone.trim(), testMessage);

    if (result.status === "FAILED") {
      res.status(502).json({
        success: false,
        error: "Test SMS failed",
        detail: result.error,
        hint: !isBeemConfigured()
          ? "BEEM_API_KEY / BEEM_SECRET_KEY are not set in .env"
          : undefined,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        to: result.dest_addr,
        messageId: result.messageId,
        status: result.status,
        simulated: result.status === "SIMULATED",
        message: testMessage,
      },
    });
  } catch (err) {
    console.error("[SMS] Unexpected error in testSMS:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

// ── GET /api/v1/sms/status ────────────────────────────────────────────────────
/**
 * Returns Beem configuration status (without exposing credentials).
 * Useful for the admin panel to know if Beem is ready.
 */
export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      provider: "Beem Africa",
      configured: isBeemConfigured(),
      senderId: config.beem.senderId || "ENTRON",
      apiKeySet: !!config.beem.apiKey,
      secretKeySet: !!config.beem.secretKey,
    },
  });
}
