import axios from "axios";
import { config } from "../config";

const BASE = `https://graph.facebook.com/v19.0/${config.whatsapp.phoneNumberId}`;

export interface TextMessage {
  to: string;
  body: string;
}

export async function sendTextMessage(msg: TextMessage): Promise<string> {
  const res = await axios.post(
    `${BASE}/messages`,
    {
      messaging_product: "whatsapp",
      to: sanitizePhone(msg.to),
      type: "text",
      text: { body: msg.body },
    },
    { headers: { Authorization: `Bearer ${config.whatsapp.token}` } }
  );
  return res.data.messages?.[0]?.id ?? "";
}

export async function sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<string> {
  const res = await axios.post(
    `${BASE}/messages`,
    {
      messaging_product: "whatsapp",
      to: sanitizePhone(to),
      type: "image",
      image: { link: imageUrl, caption },
    },
    { headers: { Authorization: `Bearer ${config.whatsapp.token}` } }
  );
  return res.data.messages?.[0]?.id ?? "";
}

function sanitizePhone(phone: string): string {
  // Ensure E.164 format for Tanzania: +255XXXXXXXXX
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `255${digits.slice(1)}`;
  }
  return digits;
}
