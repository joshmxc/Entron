/**
 * Beem Africa SMS Service
 * Docs: https://apisms.beem.africa
 *
 * Reads credentials from environment variables:
 *   BEEM_API_KEY    — your Beem API key
 *   BEEM_SECRET_KEY — your Beem secret key
 *   BEEM_SENDER_ID  — registered sender name (e.g. "ENTRON")
 *
 * Reusable for:
 *   - Guest bulk messages
 *   - OTP / verification codes
 *   - Invitation notifications
 *   - Scan / check-in alerts
 */

import axios, { AxiosError } from "axios";
import { config } from "../config";

const BEEM_URL = "https://apisms.beem.africa/v1/send";

// ── Normalize phone to Tanzania international format ──────────────────────────
// Examples:
//   0712345678  →  255712345678
//   712345678   →  255712345678
//   +255712345… →  255712345…
export function normalizeTanzaniaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, ""); // strip everything except digits

  if (digits.startsWith("255") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `255${digits.slice(1)}`;
  if (digits.length === 9 && (digits.startsWith("6") || digits.startsWith("7"))) return `255${digits}`;

  // Return as-is if we can't determine format — let Beem reject it
  return digits;
}

// ── Build the Basic Auth header ───────────────────────────────────────────────
function buildAuthHeader(): string {
  const raw = `${config.beem.apiKey}:${config.beem.secretKey}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BeemRecipient {
  to: string;         // raw phone — will be normalized internally
  message?: string;   // per-recipient message (optional — falls back to global message)
}

export interface BeemSingleResult {
  to: string;
  dest_addr: string;  // normalized phone actually sent to
  messageId: string;
  status: "SENT" | "FAILED" | "SIMULATED";
  error?: string;
}

export interface BeemBulkResult {
  sent: number;
  failed: number;
  results: BeemSingleResult[];
  raw?: unknown;       // raw Beem API response for debugging
}

// ── isConfigured ─────────────────────────────────────────────────────────────
export function isBeemConfigured(): boolean {
  return !!(config.beem.apiKey && config.beem.secretKey);
}

// ── sendBeemSMS ───────────────────────────────────────────────────────────────
/**
 * Send a single SMS via Beem Africa.
 * Returns the Beem message ID on success.
 */
export async function sendBeemSMS(
  to: string,
  message: string
): Promise<BeemSingleResult> {
  // Simulate if no credentials
  if (!isBeemConfigured()) {
    const dest = normalizeTanzaniaPhone(to);
    console.log(`[BEEM SIMULATED] To: ${dest} | ${message}`);
    return { to, dest_addr: dest, messageId: `sim_${Date.now()}`, status: "SIMULATED" };
  }

  const dest = normalizeTanzaniaPhone(to);

  const payload = {
    source_addr: config.beem.senderId,
    schedule_time: "",
    encoding: 0,
    message,
    recipients: [
      { recipient_id: 1, dest_addr: dest },
    ],
  };

  try {
    const res = await axios.post(BEEM_URL, payload, {
      headers: {
        Authorization: buildAuthHeader(),
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    const code: number = res.data?.code ?? -1;
    const ok = code === 100;

    if (!ok) {
      const errMsg = res.data?.message ?? "Unknown Beem error";
      console.error(`[BEEM] SMS failed for ${dest}: code=${code} message=${errMsg}`);
      return { to, dest_addr: dest, messageId: "", status: "FAILED", error: errMsg };
    }

    const msgId = String(
      res.data?.data?.request_id ??
      res.data?.data?.recipients?.[0]?.message_id ??
      Date.now()
    );

    console.log(`[BEEM] SMS sent to ${dest}, message_id=${msgId}`);
    return { to, dest_addr: dest, messageId: msgId, status: "SENT" };

  } catch (err) {
    const axErr = err as AxiosError;
    const detail = axErr.response?.data ?? axErr.message;
    console.error(`[BEEM] Request error for ${dest}:`, detail);
    return { to, dest_addr: dest, messageId: "", status: "FAILED", error: String(detail) };
  }
}

// ── sendBeemBulkSMS ───────────────────────────────────────────────────────────
/**
 * Send SMS to multiple recipients.
 * Beem supports multiple recipients in one request.
 * All recipients share the same message unless per-recipient messages are given.
 */
export async function sendBeemBulkSMS(
  recipients: BeemRecipient[],
  globalMessage: string
): Promise<BeemBulkResult> {
  if (!recipients.length) return { sent: 0, failed: 0, results: [] };

  // Simulate if no credentials
  if (!isBeemConfigured()) {
    const results: BeemSingleResult[] = recipients.map((r, i) => {
      const dest = normalizeTanzaniaPhone(r.to);
      console.log(`[BEEM SIMULATED] To: ${dest} | ${r.message ?? globalMessage}`);
      return { to: r.to, dest_addr: dest, messageId: `sim_${Date.now()}_${i}`, status: "SIMULATED" };
    });
    return { sent: results.length, failed: 0, results };
  }

  // Beem supports batching up to 1 000 recipients per request.
  // If per-recipient messages differ, we must send individually.
  const hasPerRecipientMessages = recipients.some((r) => r.message && r.message !== globalMessage);

  if (hasPerRecipientMessages) {
    // Send individually to allow per-guest personalized text
    const settled = await Promise.allSettled(
      recipients.map((r) => sendBeemSMS(r.to, r.message ?? globalMessage))
    );

    const results: BeemSingleResult[] = settled.map((s, i) =>
      s.status === "fulfilled"
        ? s.value
        : { to: recipients[i].to, dest_addr: normalizeTanzaniaPhone(recipients[i].to), messageId: "", status: "FAILED", error: "Promise rejected" }
    );

    return {
      sent: results.filter((r) => r.status === "SENT").length,
      failed: results.filter((r) => r.status === "FAILED").length,
      results,
    };
  }

  // All share the same message — use Beem's batch endpoint
  const beemRecipients = recipients.map((r, i) => ({
    recipient_id: i + 1,
    dest_addr: normalizeTanzaniaPhone(r.to),
  }));

  const payload = {
    source_addr: config.beem.senderId,
    schedule_time: "",
    encoding: 0,
    message: globalMessage,
    recipients: beemRecipients,
  };

  try {
    const res = await axios.post(BEEM_URL, payload, {
      headers: {
        Authorization: buildAuthHeader(),
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    const code: number = res.data?.code ?? -1;

    if (code !== 100) {
      const errMsg = res.data?.message ?? "Unknown Beem error";
      console.error(`[BEEM] Bulk SMS failed: code=${code} message=${errMsg}`);
      // Mark all as failed
      const results: BeemSingleResult[] = recipients.map((r, i) => ({
        to: r.to,
        dest_addr: beemRecipients[i].dest_addr,
        messageId: "",
        status: "FAILED",
        error: errMsg,
      }));
      return { sent: 0, failed: results.length, results, raw: res.data };
    }

    console.log(`[BEEM] Bulk SMS sent to ${recipients.length} recipients, request_id=${res.data?.data?.request_id}`);

    // Beem may return per-recipient statuses — if not, assume all sent
    const apiDetails: Array<{ message_id?: number | string; status?: string }> =
      res.data?.data?.recipients ?? [];

    const results: BeemSingleResult[] = recipients.map((r, i) => {
      const detail = apiDetails[i];
      const failed = detail?.status?.toUpperCase().includes("FAIL") ?? false;
      return {
        to: r.to,
        dest_addr: beemRecipients[i].dest_addr,
        messageId: String(detail?.message_id ?? `batch_${i}`),
        status: failed ? "FAILED" : "SENT",
      };
    });

    return {
      sent: results.filter((r) => r.status === "SENT").length,
      failed: results.filter((r) => r.status === "FAILED").length,
      results,
      raw: res.data,
    };

  } catch (err) {
    const axErr = err as AxiosError;
    const detail = axErr.response?.data ?? axErr.message;
    console.error("[BEEM] Bulk request error:", detail);

    const results: BeemSingleResult[] = recipients.map((r, i) => ({
      to: r.to,
      dest_addr: beemRecipients[i].dest_addr,
      messageId: "",
      status: "FAILED",
      error: String(detail),
    }));
    return { sent: 0, failed: results.length, results, raw: detail };
  }
}
