import axios from "axios";
import { config } from "../config";

const BASE = "https://messaging-service.co.tz";

function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return `255${digits.slice(1)}`;
  if (digits.startsWith("255")) return digits;
  if (digits.startsWith("7") && digits.length === 9) return `255${digits}`;
  return digits;
}

function headers() {
  const auth = config.sms.authType === "bearer"
    ? `Bearer ${config.sms.apiKey}`
    : `Basic ${config.sms.apiKey}`;
  return {
    Authorization: auth,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Send SMS to multiple recipients at once using messaging-service.co.tz
 * Each entry in `messages` is { to, text } — from is added automatically from config.
 */
export async function sendBulkSMS(
  messages: { to: string; text: string }[],
  reference?: string
): Promise<{ sent: number; failed: number; results: { to: string; messageId: string; status: string }[] }> {
  if (!config.sms.apiKey) {
    messages.forEach((m) => console.log(`[SMS SIMULATED] To: ${m.to} | ${m.text}`));
    return {
      sent: messages.length,
      failed: 0,
      results: messages.map((m) => ({ to: m.to, messageId: `sim_${Date.now()}`, status: "SIMULATED" })),
    };
  }

  if (config.sms.sandbox) {
    messages.forEach((m) => console.log(`[SMS SANDBOX] To: ${m.to} | ${m.text}`));
    return {
      sent: messages.length,
      failed: 0,
      results: messages.map((m) => ({ to: m.to, messageId: `sandbox_${Date.now()}`, status: "SANDBOX" })),
    };
  }

  const endpoint = config.sms.sandbox
    ? `${BASE}/api/sms/v2/test/text/multi`
    : `${BASE}/api/sms/v2/text/multi`;

  const payload: Record<string, unknown> = {
    messages: messages.map((m) => ({
      from: config.sms.senderId,
      to: sanitizePhone(m.to),
      text: m.text,
    })),
    flash: 0,
    ...(reference ? { reference } : {}),
  };

  const res = await axios.post(endpoint, payload, { headers: headers() });
  const raw: Array<{ to: string; messageId: number | string; status: { groupName: string; name: string } }> = res.data?.messages ?? [];

  const results = raw.map((r) => ({
    to: String(r.to),
    messageId: String(r.messageId),
    status: r.status?.name ?? "UNKNOWN",
  }));

  const sent = results.filter((r) => !r.status.includes("FAILED")).length;
  const failed = results.length - sent;

  return { sent, failed, results };
}

/**
 * Send a single SMS — convenience wrapper around sendBulkSMS
 */
export async function sendSMS(to: string, text: string): Promise<string> {
  const result = await sendBulkSMS([{ to, text }]);
  return result.results[0]?.messageId ?? "";
}

/**
 * Schedule an SMS to be sent at a specific date/time
 */
export async function scheduleSMS(opts: {
  to: string;
  text: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  repeat?: "hourly" | "daily" | "weekly" | "monthly";
}): Promise<string> {
  if (!config.sms.apiKey) {
    console.log(`[SMS SCHEDULED SIMULATED] To: ${opts.to} at ${opts.date} ${opts.time} | ${opts.text}`);
    return `sim_sched_${Date.now()}`;
  }

  const res = await axios.post(
    `${BASE}/api/sms/v2/text/single`,
    {
      from: config.sms.senderId,
      to: sanitizePhone(opts.to),
      text: opts.text,
      date: opts.date,
      time: opts.time,
      ...(opts.repeat ? { repeat: opts.repeat } : {}),
    },
    { headers: headers() }
  );

  return String(res.data?.messages?.[0]?.messageId ?? "");
}

/**
 * Get SMS balance from the provider
 */
export async function getSMSBalance(): Promise<{ balance: number; display: string; channel: string }> {
  if (!config.sms.apiKey) return { balance: 0, display: "API key not set", channel: "—" };

  const res = await axios.get(`${BASE}/api/v2/balance`, { headers: headers() });
  return {
    balance: res.data?.sms_balance ?? 0,
    display: res.data?.display ?? "0",
    channel: res.data?.default ?? "Internet Channel",
  };
}

/**
 * Get SMS send logs from provider
 */
export async function getSMSLogs(opts?: {
  from?: string;
  to?: string;
  sentSince?: string;
  sentUntil?: string;
  limit?: number;
}): Promise<unknown[]> {
  if (!config.sms.apiKey) return [];

  const params = new URLSearchParams();
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  if (opts?.sentSince) params.set("sentSince", opts.sentSince);
  if (opts?.sentUntil) params.set("sentUntil", opts.sentUntil);
  if (opts?.limit) params.set("limit", String(opts.limit));

  const res = await axios.get(`${BASE}/api/v2/logs?${params.toString()}`, { headers: headers() });
  return res.data?.results ?? [];
}
