import { Request, Response } from "express";
import path from "path";
import * as invitationsService from "../services/invitations.service";
import { streamZipToResponse } from "../lib/zipper";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import fs from "fs";

export async function listTemplates(req: Request, res: Response) {
  const data = await invitationsService.listTemplates(req.params.eventId);
  res.json({ success: true, data });
}

export async function uploadTemplate(req: Request, res: Response) {
  if (!req.file) { res.status(400).json({ success: false, error: "No file uploaded" }); return; }
  const fileUrl = `/uploads/templates/${req.file.filename}`;
  const fields = req.body.fields ? JSON.parse(req.body.fields) : {};
  const cardType = req.body.cardType ?? null;
  const data = await invitationsService.createTemplate(req.params.eventId, {
    name: req.body.name ?? req.file.originalname,
    fileUrl,
    fields,
    cardType,
  });
  res.status(201).json({ success: true, data });
}

export async function updateTemplate(req: Request, res: Response) {
  const { templateId } = req.params;
  const { fields, name, cardType } = req.body;
  const data = await prisma.invitationTemplate.update({
    where: { id: templateId },
    data: {
      ...(fields !== undefined && { fields }),
      ...(name !== undefined && { name }),
      ...(cardType !== undefined && { cardType: cardType ?? null }),
    },
  });
  res.json({ success: true, data });
}

export async function deleteTemplate(req: Request, res: Response) {
  const { templateId } = req.params;
  await prisma.invitationTemplate.delete({ where: { id: templateId } });
  res.json({ success: true });
}

export async function generateCards(req: Request, res: Response) {
  const { templateId, guestIds } = req.body;
  const result = await invitationsService.generateCards(req.params.eventId, templateId ?? null, guestIds);
  res.json({ success: true, data: result });
}

export async function downloadZip(req: Request, res: Response) {
  const { eventId } = req.params;
  const invitations = await prisma.guestInvitation.findMany({
    where: { guest: { eventId }, cardUrl: { not: null } },
    select: { cardUrl: true, guestId: true },
  });

  const files = invitations.map((inv) => ({
    filePath: path.join(process.cwd(), (inv.cardUrl ?? "").replace(/^\//, "")),
    name: `${inv.guestId}.jpg`,
  })).filter((f) => fs.existsSync(f.filePath));

  await streamZipToResponse(res, files, `invitations-${eventId}.zip`);
}

export async function listInvitations(req: Request, res: Response) {
  const data = await invitationsService.listInvitations(
    req.params.eventId,
    Number(req.query.page) || 1,
    Number(req.query.pageSize) || 50
  );
  res.json({ success: true, ...data });
}

export async function handleWebhook(req: Request, res: Response) {
  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      const statuses = change.value?.statuses ?? [];
      for (const s of statuses) {
        const status: "DELIVERED" | "READ" | "FAILED" =
          s.status === "delivered" ? "DELIVERED" : s.status === "read" ? "READ" : "FAILED";
        await invitationsService.updateInvitationStatus(s.id, status);
      }
    }
  }
  res.sendStatus(200);
}
