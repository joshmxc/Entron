import { Request, Response } from "express";
import * as svc from "../services/messages.service";

export async function listMessages(req: Request, res: Response) {
  const data = await svc.listMessages(
    req.params.eventId,
    Number(req.query.page) || 1,
    Number(req.query.pageSize) || 50
  );
  res.json({ success: true, ...data });
}

export async function sendMessages(req: Request, res: Response) {
  const { guestIds, message, channel } = req.body;
  if (!message || !channel) { res.status(400).json({ success: false, error: "message and channel required" }); return; }

  const allGuests = await svc.getEventGuests(req.params.eventId);
  const ids: string[] = guestIds?.length
    ? guestIds
    : allGuests.map((g) => g.id);

  const result = await svc.sendBulkMessages({
    eventId: req.params.eventId,
    guestIds: ids,
    message,
    channel,
    sentBy: req.user!.sub,
  });
  res.json({ success: true, data: result });
}

export async function getGuests(req: Request, res: Response) {
  const data = await svc.getEventGuests(req.params.eventId);
  res.json({ success: true, data });
}

export async function getSMSBalance(_req: Request, res: Response) {
  const data = await svc.getSMSBalance();
  res.json({ success: true, data });
}
