import QRCode from "qrcode";
import path from "path";
import fs from "fs/promises";
import { config } from "../config";

export async function generateQRImage(qrCode: string, eventId: string): Promise<string> {
  const dir = path.join(config.storage.uploadDir, "qr", eventId);
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${qrCode}.png`);
  await QRCode.toFile(filePath, qrCode, {
    type: "png",
    width: 300,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return `/uploads/qr/${eventId}/${qrCode}.png`;
}

export async function generateQRDataUrl(qrCode: string): Promise<string> {
  return QRCode.toDataURL(qrCode, {
    width: 300,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
