/**
 * Next SMS Service  (messaging-service.co.tz)
 * API docs: https://documenter.getpostman.com/view/1679195/2sAYkDP1XN
 *
 * Credentials are read from environment variables:
 *   NEXTSMS_USERNAME  — your Next SMS account username
 *   NEXTSMS_PASSWORD  — your Next SMS account password
 *   NEXTSMS_SENDER_ID — your registered sender name (e.g. "ENTRON")
 *
 * When credentials are missing the service logs and returns a SIMULATED result
 * so the rest of the application keeps working during development.
 *
 * Reusable for:
 *   - Bulk guest messaging
 *   - OTP / verification codes
 *   - Invitation notifications
 *   - Check-in / scan alerts
 */

import axios, { AxiosError } from "axios";
import { config } from "../config";

const BASE_URL = "https://messaging-service.co.tz";

// ── Phone normalisation ───────────────────────────────────────────────────────
// Next SMS expects Tanzania international format: 255XXXXXXXXX
// Accepts:  0712345678  →  255712345678
//           712345678   →  255712345678
//           +255712345… →  255712345…
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("255") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length === 10)  return `255${digits.slice(1)}`;
  if (digits.length === 9 && (digits.startsWith("6") || digits.startsWith("7"))) return `255${digits}`;

  // Cannot determine format — return as-is and let the API reject it
  return digits;
}

// ── Auth header ───────────────────────────────────────────────────────────────
function authHeader(): string {
  const encoded = Buffer.from(
    `${config.nextsms.username}:${config.nextsms.password}`
  ).toString("base64");
  return `Basic ${encoded}`;
}

function headers() {
  return {
    Authorization: authHeader(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ── Configuration guard ───────────────────────────────────────────────────────
export function isNextSmsConfigured(): boolean {
  return !!(config.nextsms.username && config.nextsms.password);
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type SMSStatus = "SENT" | "FAILED" | "SIMULATED";

export interface SMSResult {
  to: string;          // original phone as provided
  dest: string;        // normalised international number sent to
  messageId: string;
  status: SMSStatus;
  error?: string;
}

export interface BulkSMSResult {
  sent: number;
  failed: number;
  results: SMSResult[];
}

// ── sendSMS — single recipient ────────────────────────────────────────────────
/**
 * Send one SMS via Next SMS.
 * Returns an SMSResult describing whether it succeeded or failed.
 */
export async function sendSMS(to: string, text: string): Promise<SMSResult> {
  const dest = normalizePhone(to);

  // Simulate when credentials are not configured
  if (!isNextSmsConfigured()) {
    console.log(`[NextSMS SIMULATED] To: ${dest} | ${text}`);
    return { to, dest, messageId: `sim_${Date.now()}`, status: "SIMULATED" };
  }

  const payload = {
    from: config.nextsms.senderId,
    to:   dest,
    text,
  };

  try {
    const res = await axios.post(
      `${BASE_URL}/api/sms/v1/text/single`,
      payload,
      { headers: headers(), timeout: 15_000 }
    );

    // Next SMS returns { messages: [{ to, messageId, status: { name, groupName } }] }
    const msg = res.data?.messages?.[0];
    const groupName: string = msg?.status?.groupName ?? "";
    const statusName: string = msg?.status?.name ?? "";
    const failed = groupName === "REJECTED" || statusName.includes("FAILED");
    const messageId = String(msg?.messageId ?? Date.now());

    if (failed) {
      console.error(`[NextSMS] SMS rejected for ${dest}: ${statusName}`);
      return { to, dest, messageId, status: "FAILED", error: statusName };
    }

    console.log(`[NextSMS] SMS sent to ${dest}, messageId=${messageId}`);
    return { to, dest, messageId, status: "SENT" };

  } catch (err) {
    const axErr = err as AxiosError;
    const detail = JSON.stringify(axErr.response?.data ?? axErr.message);
    console.error(`[NextSMS] Request error for ${dest}:`, detail);
    return { to, dest, messageId: "", status: "FAILED", error: detail };
  }
}

// ── sendBulkSMS — multiple recipients ────────────────────────────────────────
/**
 * Send SMS to multiple recipients using Next SMS's multi-message endpoint.
 *
 * When `messages` contains per-recipient text (personalised), each message
 * gets its own `text`. When all messages share the same text the API still
 * accepts them in one batch request.
 *
 * Next SMS supports up to 1 000 recipients per request.
 */
export async function sendBulkSMS(
  messages: { to: string; text: string }[],
  reference?: string
): Promise<BulkSMSResult> {
  if (!messages.length) return { sent: 0, failed: 0, results: [] };

  // Simulate when credentials are not configured
  if (!isNextSmsConfigured()) {
    const results: SMSResult[] = messages.map((m, i) => {
      const dest = normalizePhone(m.to);
      console.log(`[NextSMS SIMULATED] To: ${dest} | ${m.text}`);
      return { to: m.to, dest, messageId: `sim_${Date.now()}_${i}`, status: "SIMULATED" };
    });
    return { sent: results.length, failed: 0, results };
  }

  const payload: Record<string, unknown> = {
    messages: messages.map((m) => ({
      from: config.nextsms.senderId,
      to:   normalizePhone(m.to),
      text: m.text,
    })),
    flash: 0,
    ...(reference ? { reference } : {}),
  };

  try {
    const res = await axios.post(
      `${BASE_URL}/api/sms/v2/text/multi`,
      payload,
      { headers: headers(), timeout: 30_000 }
    );

    // Response: { messages: [{ to, messageId, status: { groupName, name } }] }
    const raw: Array<{
      to: string;
      messageId: number | string;
      status: { groupName: string; name: string };
    }> = res.data?.messages ?? [];

    const results: SMSResult[] = messages.map((m, i) => {
      const dest = normalizePhone(m.to);
      const r = raw[i];
      if (!r) return { to: m.to, dest, messageId: "", status: "FAILED", error: "No API response for this recipient" };

      const failed =
        r.status?.groupName === "REJECTED" ||
        r.status?.name?.includes("FAIL") ||
        r.status?.name?.includes("REJECTED");

      return {
        to: m.to,
        dest,
        messageId: String(r.messageId),
        status: failed ? "FAILED" : "SENT",
        ...(failed ? { error: r.status?.name } : {}),
      };
    });

    const sent   = results.filter((r) => r.status === "SENT").length;
    const failed = results.filter((r) => r.status === "FAILED").length;

    console.log(`[NextSMS] Bulk result: ${sent} sent, ${failed} failed`);
    return { sent, failed, results };

  } catch (err) {
    const axErr = err as AxiosError;
    const detail = JSON.stringify(axErr.response?.data ?? axErr.message);
    console.error("[NextSMS] Bulk request error:", detail);

    // Mark everything as failed
    const results: SMSResult[] = messages.map((m) => ({
      to: m.to,
      dest: normalizePhone(m.to),
      messageId: "",
      status: "FAILED",
      error: detail,
    }));
    return { sent: 0, failed: results.length, results };
  }
}

// ── getSMSBalance ─────────────────────────────────────────────────────────────
/**
 * Fetch the remaining SMS credit balance from Next SMS.
 */
export async function getSMSBalance(): Promise<{
  balance: number;
  display: string;
  channel: string;
}> {
  if (!isNextSmsConfigured()) {
    return { balance: 0, display: "Credentials not set", channel: "—" };
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/v2/balance`, {
      headers: headers(),
      timeout: 10_000,
    });

    return {
      balance: res.data?.sms_balance ?? 0,
      display: res.data?.display       ?? String(res.data?.sms_balance ?? 0),
      channel: res.data?.default       ?? "Internet Channel",
    };
  } catch (err) {
    console.error("[NextSMS] Balance check failed:", (err as AxiosError).message);
    return { balance: 0, display: "Error fetching balance", channel: "—" };
  }
}
