/**
 * SMS Controller — Next SMS (messaging-service.co.tz)
 *
 * Handles standalone SMS endpoints used by the admin panel:
 *   GET  /sms/status  — check if credentials are configured
 *   POST /sms/send    — send a single SMS to one number
 *   POST /sms/bulk    — send to many numbers
 *   POST /sms/test    — send a fixed test message to verify credentials
 *
 * Bulk guest messaging goes through messages.controller.ts / messages.service.ts.
 */

import { Request, Response } from "express";
import {
  sendSMS,
  sendBulkSMS,
  getSMSBalance,
  normalizePhone,
  isNextSmsConfigured,
} from "../lib/nextsms";
import { config } from "../config";

// ── GET /sms/status ───────────────────────────────────────────────────────────
/**
 * Returns configuration status — no credentials are exposed.
 * The admin panel uses this to show whether SMS is ready.
 */
export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      provider:     "Next SMS",
      baseUrl:      "https://messaging-service.co.tz",
      configured:   isNextSmsConfigured(),
      usernameSet:  !!config.nextsms.username,
      passwordSet:  !!config.nextsms.password,
      senderId:     config.nextsms.senderId || "ENTRON",
    },
  });
}

// ── POST /sms/send ────────────────────────────────────────────────────────────
/**
 * Send a single SMS to one recipient.
 * Body: { phone: string, message: string }
 */
export async function sendSingle(req: Request, res: Response): Promise<void> {
  const { phone, message } = req.body as { phone?: string; message?: string };

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    res.status(400).json({ success: false, error: "phone is required" });
    return;
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }
  if (message.length > 1600) {
    res.status(400).json({ success: false, error: "message too long (max 1600 chars)" });
    return;
  }

  const normalized = normalizePhone(phone.trim());
  if (normalized.length < 10) {
    res.status(400).json({ success: false, error: "invalid phone number format" });
    return;
  }

  try {
    const result = await sendSMS(phone.trim(), message.trim());

    if (result.status === "FAILED") {
      res.status(502).json({
        success: false,
        error: "SMS delivery failed",
        detail: result.error,
        to: result.dest,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        to:        result.dest,
        messageId: result.messageId,
        status:    result.status,
        simulated: result.status === "SIMULATED",
      },
    });
  } catch (err) {
    console.error("[SMS] Unexpected error in sendSingle:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

// ── POST /sms/bulk ────────────────────────────────────────────────────────────
/**
 * Send the same message to multiple recipients.
 * Body: { recipients: string[], message: string }
 */
export async function sendBulk(req: Request, res: Response): Promise<void> {
  const { recipients, message } = req.body as {
    recipients?: string[];
    message?: string;
  };

  if (!Array.isArray(recipients) || recipients.length === 0) {
    res.status(400).json({ success: false, error: "recipients must be a non-empty array of phone numbers" });
    return;
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }
  if (recipients.length > 1000) {
    res.status(400).json({ success: false, error: "max 1000 recipients per request" });
    return;
  }

  try {
    const result = await sendBulkSMS(
      recipients.map((p) => ({ to: p, text: message.trim() }))
    );

    res.json({
      success: true,
      data: {
        sent:      result.sent,
        failed:    result.failed,
        total:     recipients.length,
        results:   result.results,
        simulated: !isNextSmsConfigured(),
      },
    });
  } catch (err) {
    console.error("[SMS] Unexpected error in sendBulk:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

// ── POST /sms/test ────────────────────────────────────────────────────────────
/**
 * Admin test endpoint — sends a fixed message to verify credentials.
 * Body: { phone: string }
 */
export async function testSMS(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as { phone?: string };

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    res.status(400).json({ success: false, error: "phone is required" });
    return;
  }

  const normalized = normalizePhone(phone.trim());
  if (normalized.length < 10) {
    res.status(400).json({ success: false, error: "invalid phone number" });
    return;
  }

  const testMessage =
    `[Entron] SMS test successful! ` +
    `Sender: ${config.nextsms.senderId || "ENTRON"} | ` +
    new Date().toLocaleTimeString("en-GB");

  try {
    const result = await sendSMS(phone.trim(), testMessage);

    if (result.status === "FAILED") {
      res.status(502).json({
        success: false,
        error:  "Test SMS failed",
        detail: result.error,
        hint:   !isNextSmsConfigured()
          ? "NEXTSMS_USERNAME or NEXTSMS_PASSWORD is not set in .env"
          : undefined,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        to:        result.dest,
        messageId: result.messageId,
        status:    result.status,
        simulated: result.status === "SIMULATED",
        message:   testMessage,
      },
    });
  } catch (err) {
    console.error("[SMS] Unexpected error in testSMS:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

// ── GET /sms/balance ──────────────────────────────────────────────────────────
/**
 * Returns the current SMS credit balance from Next SMS.
 */
export async function getBalance(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getSMSBalance();
    res.json({ success: true, data });
  } catch (err) {
    console.error("[SMS] Balance check error:", err);
    res.status(500).json({ success: false, error: "Could not fetch balance" });
  }
}
