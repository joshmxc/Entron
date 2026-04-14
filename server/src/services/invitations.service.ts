import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { GuestType } from "../../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { generateQRImage } from "../lib/qrcode";
import { emitInvitationStatus } from "../lib/socket";

export async function createTemplate(eventId: string, data: {
  name: string;
  fileUrl: string;
  fields: Record<string, unknown>;
  cardType?: GuestType | null;
}) {
  return prisma.invitationTemplate.create({
    data: {
      eventId,
      name: data.name,
      fileUrl: data.fileUrl,
      fields: data.fields as object,
      cardType: data.cardType ?? null,
    },
  });
}

export async function listTemplates(eventId: string) {
  return prisma.invitationTemplate.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } });
}

export async function generateCards(
  eventId: string,
  templateId: string | null,
  guestIds: string[]
): Promise<{ generated: number; failed: number }> {
  // Load all templates for this event, keyed by cardType
  const allTemplates = await prisma.invitationTemplate.findMany({ where: { eventId } });
  const byType = new Map(allTemplates.map((t) => [t.cardType, t]));

  // If a specific templateId was passed, use that as fallback
  const fallback = templateId
    ? allTemplates.find((t) => t.id === templateId) ?? null
    : (byType.get(null) ?? allTemplates[0] ?? null);

  if (!fallback && allTemplates.length === 0) {
    throw { status: 404, message: "Hakuna templeti iliyopatikana" };
  }

  let generated = 0;
  let failed = 0;

  for (const guestId of guestIds) {
    try {
      const guest = await prisma.guest.findUnique({ where: { id: guestId } });
      if (!guest) { failed++; continue; }

      // Pick template: type-specific first, then fallback
      const template = byType.get(guest.guestType) ?? fallback;
      if (!template) { failed++; continue; }

      const fields = template.fields as Record<string, { x: number; y: number; size?: number; color?: string }>;

      // Ensure QR image exists — auto-generate if missing
      let qrImageUrl = guest.qrImageUrl;
      if (!qrImageUrl) {
        qrImageUrl = await generateQRImage(guest.qrCode, eventId);
        await prisma.guest.update({ where: { id: guestId }, data: { qrImageUrl } });
      }

      // Verify QR file actually exists on disk
      const qrDiskPath = path.join(process.cwd(), qrImageUrl.replace(/^\//, ""));
      const qrExists = await fs.access(qrDiskPath).then(() => true).catch(() => false);
      if (!qrExists) {
        qrImageUrl = await generateQRImage(guest.qrCode, eventId);
        await prisma.guest.update({ where: { id: guestId }, data: { qrImageUrl } });
      }

      const templatePath = path.join(process.cwd(), template.fileUrl.replace(/^\//, ""));
      const outDir = path.join(config.storage.uploadDir, "invitations", eventId);
      await fs.mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, `${guestId}.jpg`);

      const composites: sharp.OverlayOptions[] = [];

      // Guest name text overlay
      // x,y are the CENTER of the element in natural image coordinates
      const nameField = fields.guestName;
      if (nameField) {
        const fullName = `${guest.firstName} ${guest.lastName}`;
        const fontSize = nameField.size ?? 48;
        const color = nameField.color ?? "#ffffff";
        const textWidth = Math.ceil(fullName.length * fontSize * 0.62);
        const svgH = Math.ceil(fontSize * 1.4);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${textWidth}" height="${svgH}">
          <text x="0" y="${Math.ceil(fontSize * 1.1)}" font-size="${fontSize}" fill="${color}" font-family="Arial,sans-serif" font-weight="bold">${escapeXml(fullName)}</text>
        </svg>`;
        // Center the text around (x, y)
        const left = Math.max(0, Math.round(nameField.x - textWidth / 2));
        const top = Math.max(0, Math.round(nameField.y - svgH / 2));
        composites.push({ input: Buffer.from(svg), left, top });
      }

      // QR code overlay — center the QR around (x, y)
      const qrField = fields.qrCode;
      if (qrField) {
        const qrSize = qrField.size ?? 200;
        const resizedQR = await sharp(qrDiskPath).resize(qrSize, qrSize).png().toBuffer();
        const left = Math.max(0, Math.round(qrField.x - qrSize / 2));
        const top = Math.max(0, Math.round(qrField.y - qrSize / 2));
        composites.push({ input: resizedQR, left, top });
      }

      await sharp(templatePath).composite(composites).jpeg({ quality: 92 }).toFile(outPath);

      const cardUrl = `/uploads/invitations/${eventId}/${guestId}.jpg`;
      // Find existing invitation for this guest, then update or create
      const existing = await prisma.guestInvitation.findFirst({ where: { guestId } });
      if (existing) {
        await prisma.guestInvitation.update({
          where: { id: existing.id },
          data: { cardUrl, templateId: template.id, status: "PENDING" },
        });
      } else {
        await prisma.guestInvitation.create({
          data: { guestId, templateId: template.id, cardUrl, status: "PENDING" },
        });
      }

      generated++;
    } catch (err) {
      console.error(`Card generation failed for guest ${guestId}:`, err);
      failed++;
    }
  }

  return { generated, failed };
}

function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function listInvitations(eventId: string, page = 1, pageSize = 50) {
  const guests = await prisma.guest.findMany({
    where: { eventId },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { invitations: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const total = await prisma.guest.count({ where: { eventId } });
  return { data: guests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function updateInvitationStatus(
  messageId: string,
  status: "DELIVERED" | "READ" | "FAILED",
  errorMessage?: string
) {
  const inv = await prisma.guestInvitation.findFirst({ where: { messageId } });
  if (!inv) return;

  const update: Record<string, unknown> = { status };
  if (status === "DELIVERED") update.deliveredAt = new Date();
  if (status === "READ") update.readAt = new Date();
  if (errorMessage) update.errorMessage = errorMessage;

  await prisma.guestInvitation.update({ where: { id: inv.id }, data: update });
  emitInvitationStatus(inv.guestId, { status, messageId });
}
