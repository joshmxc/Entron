import { Request, Response } from "express";
import * as whatsappService from "../services/whatsapp.service";
import { config } from "../config";

export async function sendBulk(req: Request, res: Response) {
  const { guestIds, message, includeCard } = req.body;
  const result = await whatsappService.sendBulk(guestIds, message, req.user!.sub, includeCard ?? true);
  res.json({ success: true, data: result });
}

export async function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsapp.webhookVerifyToken) {
    res.send(challenge);
  } else {
    res.sendStatus(403);
  }
}

export async function receiveWebhook(req: Request, res: Response) {
  // Handled by invitations controller for status updates
  res.sendStatus(200);
}
