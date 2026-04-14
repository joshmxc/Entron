import axios from "axios";
import { config } from "../config";

const BASE = "https://sandbox.safaricom.co.ke"; // switch to prod URL in prod

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`
  ).toString("base64");

  const res = await axios.get(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  return res.data.access_token;
}

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
}

function getPassword(timestamp: string): string {
  const raw = `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export async function stkPush(phone: string, amount: number, accountRef: string): Promise<string> {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);

  const sanitized = phone.replace(/\D/g, "");
  const msisdn = sanitized.startsWith("0") ? `254${sanitized.slice(1)}` : sanitized;

  const res = await axios.post(
    `${BASE}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: config.mpesa.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: msisdn,
      PartyB: config.mpesa.shortcode,
      PhoneNumber: msisdn,
      CallBackURL: config.mpesa.callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: "Entron Payment",
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data.CheckoutRequestID;
}
